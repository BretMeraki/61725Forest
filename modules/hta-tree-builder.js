/**
 * HTA Tree Builder Module
 * Handles HTA tree construction and strategic task generation
 */

export class HtaTreeBuilder {
  constructor(dataPersistence, projectManagement, llmInterface) {
    this.dataPersistence = dataPersistence;
    this.projectManagement = projectManagement;
    this.llm = llmInterface; // Store reference to Claude/LLM interface
    // Collect Claude generation requests when an online LLM is not available.
    this.pendingClaudeRequests = [];
  }

  async buildHTATree(pathName = null, learningStyle = 'mixed', focusAreas = []) {
    try {
      const projectId = await this.projectManagement.requireActiveProject();
      const config = await this.dataPersistence.loadProjectData(projectId, 'config.json');
      
      if (!config) {
        throw new Error('Project configuration not found');
      }

      // Require additional context before building
      if (!config.context || (typeof config.context === 'string' && config.context.trim() === '')) {
        return {
          content: [{ type: 'text', text: 'ℹ️ Additional context required before generating a roadmap. Please provide background, constraints, or any information that will guide the learning plan.' }],
          needs_context: true,
          missing: ['context']
        };
      }

      // Determine which path to build for
      const targetPath = pathName || config.activePath || 'general';
      
      // Check if path exists in learning paths
      const pathExists = config.learning_paths?.some(p => p.path_name === targetPath) || targetPath === 'general';
      if (!pathExists) {
        throw new Error(`Learning path "${targetPath}" not found in project configuration`);
      }

      // Load existing HTA data for this path
      const existingHTA = await this.loadPathHTA(projectId, targetPath);
      
      // Generate strategic framework
      const htaData = await this.generateHTAFramework(config, targetPath, learningStyle, focusAreas, existingHTA);
      
      // Save HTA data
      await this.savePathHTA(projectId, targetPath, htaData);
      
      // Update project config with active path
      config.activePath = targetPath;
      await this.dataPersistence.saveProjectData(projectId, 'config.json', config);

      // If no frontier nodes were generated, return the pending Claude request directly so MCP can prompt the user
      if ((htaData.frontierNodes?.length || 0) === 0 && this.pendingClaudeRequests.length > 0) {
        // Return the FIRST pending request (one branch at a time is fine – Claude can iterate)
        const pending = this.pendingClaudeRequests[0];
        return {
          content: [{ type: 'text', text: pending.claude_request || 'LLM generation required' }],
          pending_claude: pending
        };
      }

      return {
        content: [{
          type: 'text',
          text: `🌳 HTA Tree built successfully for "${targetPath}" path!\n\n` +
               `**Strategic Branches**: ${htaData.strategicBranches?.length || 0}\n` +
               `**Frontier Nodes**: ${htaData.frontierNodes?.length || 0}\n` +
               `**Learning Style**: ${learningStyle}\n` +
               `**Focus Areas**: ${focusAreas.join(', ') || 'General exploration'}\n\n` +
               `✅ Ready to start learning with intelligent task sequencing!`
        }],
        hta_tree: htaData,
        active_path: targetPath
      };
    } catch (error) {
      await this.dataPersistence.logError('buildHTATree', error, { pathName, learningStyle, focusAreas });
      return {
        content: [{
          type: 'text',
          text: `Error building HTA tree: ${error.message}`
        }]
      };
    }
  }

  async loadPathHTA(projectId, pathName) {
    if (pathName === 'general') {
      return await this.dataPersistence.loadProjectData(projectId, 'hta.json');
    } else {
      return await this.dataPersistence.loadPathData(projectId, pathName, 'hta.json');
    }
  }

  async savePathHTA(projectId, pathName, htaData) {
    if (pathName === 'general') {
      return await this.dataPersistence.saveProjectData(projectId, 'hta.json', htaData);
    } else {
      return await this.dataPersistence.savePathData(projectId, pathName, 'hta.json', htaData);
    }
  }

  async generateHTAFramework(config, pathName, learningStyle, focusAreas, existingHTA) {
    const goal = config.goal;
    const knowledgeLevel = config.knowledge_level || 1;
    const interests = this.getPathInterests(config, pathName);
    
    // Generate strategic branches
    const strategicBranches = await this.generateStrategicBranches(goal, pathName, focusAreas, knowledgeLevel);
    
    // Generate frontier nodes (ready-to-execute tasks)
    const frontierNodes = [];

    return {
      pathName,
      goal,
      strategicBranches,
      frontierNodes,
      learningStyle,
      focusAreas,
      knowledgeLevel,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  getPathInterests(config, pathName) {
    if (pathName === 'general') {
      return config.specific_interests || [];
    }
    
    const path = config.learning_paths?.find(p => p.path_name === pathName);
    return path?.interests || config.specific_interests || [];
  }

  async generateStrategicBranches(goal, pathName, focusAreas, knowledgeLevel) {
    // 1. If focus areas are supplied, use them directly (purely user-driven, no hard-coding)
    if (Array.isArray(focusAreas) && focusAreas.length > 0) {
      const customBranches = focusAreas.map((raw) => {
        const area = String(raw).trim();
        return {
          id: `focus_${area.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`.replace(/_+/g, '_').replace(/^_|_$/g, ''),
          title: area.charAt(0).toUpperCase() + area.slice(1),
          priority: 'high',
          completed: false,
          description: `Roadmap for developing expertise in ${area}`,
          expected_duration: this.estimateDuration(knowledgeLevel),
          subBranches: []
        };
      });

      // Attempt to enrich with sub-branches just like auto-generated domains
      for (const branch of customBranches) {
        try {
          // eslint-disable-next-line no-await-in-loop
          branch.subBranches = await this.generateSubBranches(branch.title, knowledgeLevel);
        } catch (_) {
          branch.subBranches = [];
        }
      }

      return customBranches;
    }

    // 2. Otherwise, ask the LLM to propose 3-6 broad domains/pillars for the given goal
    const prompt = `You are a curriculum architect. Propose 3-6 top-level learning domains that together form a comprehensive roadmap toward the goal "${goal}". Domains must be short noun phrases (e.g. \"Core Grammar\", \"Cultural Fluency\"). Return them as a JSON array of strings.`;

    const aiResp = await this.llm.requestIntelligence('hta-domain-generation', { prompt });
    let domains = [];
    if (aiResp && !aiResp.request_for_claude) {
      try {
        const text = aiResp.completion || aiResp.answer || aiResp.text || '[]';
        domains = JSON.parse(text);
      } catch (_) { /* ignore parsing failure */ }
    }

    // 3. Fallback: create a single generic "General" domain so the tree can still build—no hard-coded subject matter.
    if (!Array.isArray(domains) || domains.length === 0) {
      domains = ['General'];
    }

    // Build enriched branch objects
    const branches = domains.map((d, idx) => ({
      id: `domain_${idx + 1}`,
      title: d,
      priority: 'high',
      completed: false,
      description: `Roadmap for ${d}`,
      expected_duration: this.estimateDuration(knowledgeLevel),
      subBranches: []
    }));

    // Populate up to 3 sub-branches for each top-level domain (non-blocking)
    for (const branch of branches) {
      try {
        branch.subBranches = await this.generateSubBranches(branch.title, knowledgeLevel);
      } catch (_) {
        // Fail gracefully; leave subBranches empty
        branch.subBranches = [];
      }
    }

    return branches;
  }

  async generateSequencedFrontierNodes(strategicBranches, interests, learningStyle, knowledgeLevel, existingHTA, context = '') {
    const frontierNodes = [];
    let nodeId = 1;

    // Extract existing completed tasks to avoid duplication
    const completedTasks = existingHTA?.frontierNodes?.filter(n => n.completed)?.map(n => n.title) || [];

    for (const branch of strategicBranches) {
      // Pure AI generation: ask the LLM to generate tasks for this branch
      const aiNodes = await this.generateBranchNodesAI(
        branch,
        interests,
        learningStyle,
        knowledgeLevel,
        completedTasks,
        nodeId,
        context
      );
      frontierNodes.push(...aiNodes);
      nodeId += aiNodes.length;
    }

    // Sort by priority and difficulty
    return this.sortNodesBySequence(frontierNodes, knowledgeLevel);
  }

  // Remove all template-based code. Use LLM to generate nodes for each branch.
  async generateBranchNodesAI(branch, interests, learningStyle, knowledgeLevel, completedTasks, startNodeId, context = '') {
    // CRITICAL FIX: Much more explicit prompt for proper beginner handling
    let levelGuidance = '';
    if (knowledgeLevel <= 2) {
      levelGuidance = `CRITICAL: This is a COMPLETE BEGINNER (level ${knowledgeLevel}/10). Tasks must be:
- Extremely simple, basic actions that can be done in 15-25 minutes
- Difficulty level 1 ONLY (no exceptions)
- No prior knowledge assumed
- Focus on "getting familiar" and "first steps"
- Examples: "Hold a guitar for 5 minutes", "Find middle C on piano", "Crack an egg into a bowl"`;
    } else if (knowledgeLevel <= 4) {
      levelGuidance = `This is an EARLY LEARNER (level ${knowledgeLevel}/10). Tasks should be:
- Simple but slightly more involved (25-45 minutes)
- Difficulty 1-2 maximum
- Build on very basic foundations
- Examples: "Play a single note cleanly", "Make scrambled eggs", "Write a simple HTML page"`;
    } else {
      levelGuidance = `This is an INTERMEDIATE+ learner (level ${knowledgeLevel}/10). Tasks can be more complex.`;
    }

    const contextSection = context ? `\n\nIMPORTANT CONTEXT: ${context}\n` : '';
    
    const prompt = `You are an expert in learning design. Generate a list of 3-5 actionable, concrete, and appropriately-leveled tasks for a learner with the following context:\n\n` +
      `Goal: ${branch.title}\n` +
      `Branch Type: ${branch.title} (${branch.description})\n` +
      `Knowledge Level: ${knowledgeLevel}/10\n` +
      `${levelGuidance}${contextSection}\n` +
      `Interests: ${interests.join(', ') || 'None'}\n` +
      `Learning Style: ${learningStyle}\n\n` +
      `ABSOLUTELY NO TEMPLATES OR GENERIC PLACEHOLDERS. Tasks must be specific, realistic, and tailored to the actual level and context.\n` +
      `If context mentions "never done X" or "complete beginner", ensure tasks start from absolute zero.\n` +
      `Return the result as a JSON array of objects, each with: title, description, difficulty (1-5), duration (in minutes), and prerequisites (array of titles, can be empty).\n\n` +
      `Example for complete beginner guitar: [{"title": "Hold guitar comfortably", "description": "Practice holding the guitar in playing position for 5 minutes", "difficulty": 1, "duration": 15, "prerequisites": []}]`;

    // Call the LLM (Claude) via the stored interface
    const aiResponse = await this.llm.requestIntelligence('hta-task-generation', { prompt });
    let tasks = [];
    
    // CRITICAL FIX: Check if we actually got a real AI response
    if (aiResponse && aiResponse.request_for_claude) {
      // Queue a Claude generation request to be returned to the client via MCP
      this.pendingClaudeRequests.push({
        claude_request: prompt,
        type: 'tasks',
        context: { branchId: branch.id, pathName: branch.title }
      });
      // Return no tasks – actual tasks will be supplied by Claude later
      tasks = [];
    } else {
      // Try to parse real LLM response
      try {
        const responseText = aiResponse.completion || aiResponse.answer || aiResponse.text || '[]';
        tasks = JSON.parse(responseText);
        if (!Array.isArray(tasks) || tasks.length === 0) {
          throw new Error('Empty or invalid response');
        }
      } catch (e) {
        console.warn('⚠️  AI response parsing failed, using fallback tasks');
        tasks = this.generateFallbackTasks(branch, knowledgeLevel, interests);
      }
    }

    // Filter out completed tasks and post-process for beginner appropriateness
    const filtered = tasks.filter(t => !completedTasks.includes(t.title)).map(t => {
      // CRITICAL FIX: Ensure difficulty matches knowledge level properly
      if (knowledgeLevel <= 2) {
        // Complete beginners (1-2) should only get difficulty 1
        t.difficulty = 1;
        // Cap duration to 25 minutes for beginners
        if (typeof t.duration === 'number') {
          t.duration = Math.min(25, t.duration);
        }
      } else if (knowledgeLevel <= 4) {
        // Early learners (3-4) can handle difficulty 1-2
        t.difficulty = Math.min(2, Math.max(1, t.difficulty || 1));
        if (typeof t.duration === 'number') {
          t.duration = Math.min(45, t.duration);
        }
      } else if (knowledgeLevel <= 6) {
        // Intermediate learners (5-6) can handle difficulty 1-3
        t.difficulty = Math.min(3, Math.max(1, t.difficulty || 2));
        if (typeof t.duration === 'number') {
          t.duration = Math.min(60, t.duration);
        }
      } else {
        // Advanced learners (7+) can handle any difficulty
        t.difficulty = Math.min(5, Math.max(1, t.difficulty || 3));
      }
      return t;
    });

    // Map to node format
    return filtered.map((t, i) => ({
      id: `node_${startNodeId + i}`,
      title: t.title,
      description: t.description,
      branch: branch.id,
      difficulty: t.difficulty || 1,
      priority: 200 + (t.difficulty || 1) * 10,
      duration: typeof t.duration === 'number' ? `${t.duration} minutes` : (t.duration || '30 minutes'),
      prerequisites: t.prerequisites || [],
      completed: false,
      opportunityType: t.opportunityType || undefined
    }));
  }

  sortNodesBySequence(frontierNodes, knowledgeLevel) {
    // Sort by priority (higher first), then by difficulty (appropriate for knowledge level)
    return frontierNodes.sort((a, b) => {
      // First by priority
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // CRITICAL FIX: Proper difficulty matching for beginners
      let idealDifficulty;
      if (knowledgeLevel <= 2) {
        idealDifficulty = 1; // Beginners need difficulty 1 only
      } else if (knowledgeLevel <= 4) {
        idealDifficulty = 2; // Early learners prefer difficulty 2
      } else if (knowledgeLevel <= 6) {
        idealDifficulty = 3; // Intermediate learners prefer difficulty 3
      } else {
        idealDifficulty = Math.min(knowledgeLevel - 2, 5); // Advanced learners
      }
      
      const aDiffDistance = Math.abs(a.difficulty - idealDifficulty);
      const bDiffDistance = Math.abs(b.difficulty - idealDifficulty);
      
      return aDiffDistance - bDiffDistance;
    });
  }

  generateFallbackTasks(branch, knowledgeLevel, interests) {
    // Fallback disabled – require external Claude generation
    return [];
  }

  // Disable template fallback – empty list signals need for Claude
  generateFallbackTasksNode(branch, startNodeId) {
    return [];
  }

  // ====== NEW HELPERS FOR MULTILAYER ROADMAP ======
  /**
   * Very rough duration estimate based on learner level.
   * Beginners will have shorter domain time-frames; advanced learners may need longer.
   */
  estimateDuration(knowledgeLevel) {
    if (knowledgeLevel <= 2) {return '0-3 months';}
    if (knowledgeLevel <= 4) {return '2-6 months';}
    if (knowledgeLevel <= 6) {return '4-9 months';}
    return '6-12+ months';
  }

  /**
   * Ask the LLM for 2-3 sub-domains within a given top-level domain.
   * Falls back to an empty array on any failure.
   * @param {string} domainTitle
   * @param {number} knowledgeLevel
   */
  async generateSubBranches(domainTitle, knowledgeLevel) {
    const prompt = `You are a curriculum architect. Propose 2-3 logical sub-domains (1-3 word noun phrases) that sit under the broader domain "${domainTitle}" for a learner at knowledge level ${knowledgeLevel}/10. Return as a JSON array of strings.`;

    try {
      const resp = await this.llm.requestIntelligence('hta-subdomain-generation', { prompt });
      if (resp && !resp.request_for_claude) {
        const text = resp.completion || resp.answer || resp.text || '[]';
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3).map((s, idx) => ({
            id: `${domainTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_sub_${idx + 1}`.replace(/_+/g, '_'),
            title: s,
            description: `Sub-domain of ${domainTitle}: ${s}`
          }));
        }
      }
    } catch (_) {/* ignore */}

    // === Heuristic fallback: derive 2 simple sub-domains from the domain title ===
    const words = domainTitle.split(/\s+/).filter(w=>w.length>3);
    if (words.length >= 2) {
      const first = words[0];
      const second = words[1];
      return [first, second].map((w,idx)=>({
        id: `${domainTitle.toLowerCase().replace(/[^a-z0-9]+/g,'_')}_sub_${idx+1}`.replace(/_+/g,'_'),
        title: w.charAt(0).toUpperCase()+w.slice(1),
        description: `Sub-domain of ${domainTitle}: ${w}`
      }));
    }

    // If even heuristic fails, return empty array
    return [];
  }
}