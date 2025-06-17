/**
 * Tool Router Module
 * Handles MCP tool request routing and execution
 */

import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export class ToolRouter {
  constructor(server, forestServer) {
    this.server = server;
    this.forestServer = forestServer;
    this.middlewares = [];
    // Register the truthful middleware as the first middleware
    this.use(this.truthfulMiddleware.bind(this));
  }

  // Middleware registration
  use(middlewareFn) {
    this.middlewares.push(middlewareFn);
  }

  // The truthful middleware
  async truthfulMiddleware(toolName, args, next) {
    // Only run the wrapper for tools that produce free-form text from the LLM.
    // Skip everything else (project CRUD, scheduling, etc.) to avoid noisy metadata.
    const llmTools = new Set(['request_claude_generation', 'ask_truthful', 'ask_truthful_claude']);

    if (!llmTools.has(toolName)) {
      return await next();
    }

    // Bypass self-calls to avoid infinite recursion
    if (toolName === 'ask_truthful' || toolName === 'ask_truthful_claude') {
      return await next();
    }

    // ---------- 1. Fire off pre-check in parallel (if we have user prompt-like text) ----------
    const promptLike = args?.prompt || args?.input || args?.text || '';
    const preCheckPromise = promptLike
      ? this.forestServer.askTruthfulClaude(promptLike).catch(e => ({ answer: '', critique: 'Error running truthful pre-check: ' + e.message }))
      : Promise.resolve(null);

    // ---------- 2. Execute the real tool while pre-check is running ----------
    const toolResult = await next();

    // ---------- 3. Extract plain text from the tool response ----------
    let responseText = '';
    if (typeof toolResult === 'string') {
      responseText = toolResult;
    } else if (toolResult?.answer) {
      responseText = toolResult.answer;
    } else if (Array.isArray(toolResult?.content) && toolResult.content[0]?.text) {
      responseText = toolResult.content.map(c => c.text).join('\n\n');
    } else if (toolResult?.text) {
      responseText = toolResult.text;
    } else {
      responseText = JSON.stringify(toolResult).slice(0, 2000);
    }

    // ---------- 4. Kick off post-check ----------
    const postCheckPromise = this.forestServer
      .askTruthfulClaude(responseText)
      .catch(e => ({ answer: '', critique: 'Error running truthful post-check: ' + e.message }));

    // Wait for both checks to finish
    let [preCheck, postCheck] = await Promise.all([preCheckPromise, postCheckPromise]);

    // ---------- 5. Analyse critique and optionally auto-revise ----------
    const needsRevision = /inaccurate|uncertain|misleading|incorrect|speculative|wrong|guess/i.test(postCheck?.critique || '');
    if (needsRevision) {
      try {
        const revised = await this.forestServer.askTruthfulClaude(
          `Please correct any factual errors or uncertainties in the following answer, and respond in full again.\n\nOriginal answer:\n${responseText}\n\nCritique:\n${postCheck.critique}`
        );
        if (revised?.answer) {
          toolResult.revised_answer = revised.answer;
          postCheck = revised; // Replace post-check with the revised self-critique
        }
      } catch (e) {
        // Best-effort; ignore failure, keep original critique
      }
    }

    // ---------- 6. Derive a simple truthiness score (1 = very truthful, 0 = low confidence) ----------
    const negativeKeywords = ['inaccurate', 'uncertain', 'misleading', 'incorrect', 'speculative', 'wrong', 'guess'];
    const negCount = negativeKeywords.reduce((acc, kw) => (postCheck?.critique?.toLowerCase().includes(kw) ? acc + 1 : acc), 0);
    const truthinessScore = Number((1 - negCount / negativeKeywords.length).toFixed(2));

    // ---------- 7. Return augmented result ----------
    return {
      ...toolResult,
      _truthful_precheck: preCheck,
      _truthful_postcheck: postCheck,
      _truthiness_score: truthinessScore
    };
  }

  // Main tool call dispatcher with middleware support
  async dispatchTool(toolName, args) {
    // Compose middleware chain
    let idx = -1;
    const runner = async () => {
      idx++;
      if (idx < this.middlewares.length) {
        return await this.middlewares[idx](toolName, args, runner);
      } else {
        // Final handler: actual tool call
        switch (toolName) {
          case 'create_project':
            return await this.forestServer.createProject(args);
          case 'switch_project':
            return await this.forestServer.switchProject(args.project_id);
          case 'list_projects':
            return await this.forestServer.listProjects();
          case 'get_active_project':
            return await this.forestServer.getActiveProject();
          case 'build_hta_tree':
            return await this.forestServer.buildHTATree(args.path_name, args.learning_style || 'mixed', args.focus_areas || []);
          case 'get_hta_status':
            return await this.forestServer.getHTAStatus();
          case 'generate_daily_schedule':
            return await this.forestServer.generateDailySchedule(
              args.date || null, 
              args.energy_level ?? 3, 
              args.available_hours || null,
              args.focus_type || 'mixed',
              args.schedule_request_context || 'User requested schedule'
            );
          case 'complete_block':
            return await this.forestServer.completeBlock(
              args.block_id,
              args.outcome,
              args.learned || '',
              args.next_questions || '',
              args.energy_level,
              args.difficulty_rating ?? args.difficulty ?? 1,
              args.breakthrough || false
            );
          case 'complete_with_opportunities':
            return await this.forestServer.completeBlock(
              args.block_id,
              args.outcome,
              args.learned || '',
              args.next_questions || '',
              args.energy_level,
              args.difficulty_rating ?? args.difficulty ?? 1,
              args.breakthrough || false,
              // OPPORTUNITY DETECTION CONTEXT
              args.engagement_level || 5,
              args.unexpected_results || [],
              args.new_skills_revealed || [],
              args.external_feedback || [],
              args.social_reactions || [],
              args.viral_potential || false,
              args.industry_connections || [],
              args.serendipitous_events || []
            );
          case 'get_next_task':
            return await this.forestServer.getNextTask(
              args.context_from_memory || '',
              args.energy_level || 3,
              args.time_available || '30 minutes'
            );
          case 'current_status':
            return await this.forestServer.currentStatus();
          case 'evolve_strategy':
            return await this.forestServer.evolveStrategy(args.feedback || '');
          case 'generate_tiimo_export':
            return await this.forestServer.generateTiimoExport(args.include_breaks ?? true);
          case 'analyze_performance':
            return await this.forestServer.analyzePerformance();
          case 'review_week':
            return await this.forestServer.reviewPeriod(7);
          case 'review_month':
            return await this.forestServer.reviewPeriod(30);
          case 'sync_forest_memory':
            return await this.forestServer.syncForestMemory();
          case 'debug_task_sequence':
            return await this.forestServer.debugTaskSequence();
          case 'repair_sequence':
            return await this.forestServer.repairSequence(args.force_rebuild || false);
          case 'focus_learning_path':
            return await this.forestServer.focusLearningPath(args.path_name, args.duration || 'until next switch');
          case 'list_learning_paths':
            return await this.forestServer.listLearningPaths();
          case 'analyze_complexity_evolution':
            return await this.forestServer.analyzeComplexityEvolution();
          case 'analyze_identity_transformation':
            return await this.forestServer.analyzeIdentityTransformation();
          case 'analyze_reasoning':
            return await this.forestServer.analyzeReasoning(args.include_detailed_analysis ?? true);
          case 'ask_truthful':
          case 'ask_truthful_claude':
            return await this.forestServer.askTruthfulClaude(args.prompt);
          case 'debug_health_check':
            return await this.forestServer.debugCommands.healthCheck();
          case 'debug_trace_task':
            return await this.forestServer.debugCommands.traceTask(args.project_id || null);
          case 'debug_validate':
            return await this.forestServer.debugCommands.validateCurrent();
          case 'debug_export':
            return await this.forestServer.debugCommands.exportLogs();
          case 'debug_summary':
            return await this.forestServer.debugCommands.getSummary();
          case 'request_claude_generation':
            return await this.forestServer.requestClaudeGeneration(
              args.prompt,
              args.generation_type || 'tasks',
              args.context || {}
            );
          case 'generate_hta_tasks':
            return await this.forestServer.storeGeneratedTasks(args.branch_tasks);
          case 'generate_integrated_schedule':
            return await this.forestServer.generateIntegratedSchedule(
              args.date || null,
              args.energy_level || 3
            );
          case 'complete_block_and_next': {
            const completion = await this.forestServer.completeBlock(
              args.block_id,
              args.outcome,
              args.learned || '',
              args.next_questions || '',
              args.energy_level,
              args.difficulty_rating ?? args.difficulty ?? 1,
              args.breakthrough || false
            );
            const next = await this.forestServer.getNextTask('', args.energy_level || 3, '30 minutes');
            return { ...completion, next_task: next };
          }
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
      }
    };
    return await runner();
  }

  setupRouter() {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Extract outside try so we can reference in catch without scope issues
      const { name: toolName, arguments: args } = request.params;
      try {
        return await this.dispatchTool(toolName, args);
      } catch (error) {
        // Log error with context for debugging; avoid ReferenceError
        console.error('Tool dispatch failed:', {
          toolName,
          args: Object.keys(args || {}),
          error: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n')
        });

        // Propagate error upward with original context preserved
        throw new Error(`Tool '${toolName}' failed: ${error.message}`, { cause: error });
      }
    });
  }
}