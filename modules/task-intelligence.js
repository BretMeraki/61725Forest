/**
 * Task Intelligence Module
 * Handles smart task generation and strategy evolution
 */

// @ts-nocheck
export class TaskIntelligence {
  constructor(dataPersistence, projectManagement) {
    this.dataPersistence = dataPersistence;
    this.projectManagement = projectManagement;
  }

  async getNextTask(contextFromMemory = '', energyLevel = 3, timeAvailable = '30 minutes') {
    try {
      const projectId = await this.projectManagement.requireActiveProject();
      const config = await this.dataPersistence.loadProjectData(projectId, 'config.json');
      
      if (!config) {
        throw new Error(`Project configuration not found for project '${projectId}' in getNextTask. Ensure project exists and config.json is valid.`);
      }

      // Extract project context
      const projectContext = {
        goal: config.goal,
        domain: config.domain,
        learningStyle: config.learningStyle,
        activePath: config.activePath || 'general'
      };

      const htaData = await this.loadPathHTA(projectId, projectContext.activePath);
      
      if (!htaData || !Array.isArray(htaData.frontierNodes) || htaData.frontierNodes.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'ℹ️ Roadmap is in place but no actionable tasks were found. Use `generate_hta_tasks` to populate tasks from the roadmap, or run `evolve_strategy` to let the system suggest next steps.'
          }]
        };
      }

      const selectedTask = this.selectOptimalTask(htaData, energyLevel, timeAvailable, contextFromMemory, projectContext);
      
      if (!selectedTask) {
        return {
          content: [{
            type: 'text',
            text: '🎯 No more tasks available in current sequence.\n\n' +
                 '💡 **Next Steps**:\n' +
                 '• Use `evolve_strategy` to generate new tasks\n' +
                 '• Use `build_hta_tree` to rebuild learning path\n' +
                 '• Use `generate_daily_schedule` for comprehensive planning'
          }]
        };
      }

      const taskResponse = this.formatTaskResponse(selectedTask, energyLevel, timeAvailable);
      
      return {
        content: [{
          type: 'text',
          text: taskResponse
        }],
        selected_task: selectedTask,
        energy_level: energyLevel,
        time_available: timeAvailable,
        context_used: contextFromMemory ? 'yes' : 'no',
        project_context: projectContext
      };
    } catch (error) {
      await this.dataPersistence.logError('getNextTask', error, { contextFromMemory, energyLevel, timeAvailable });
      return {
        content: [{
          type: 'text',
          text: `Error getting next task: ${error.message}`
        }]
      };
    }
  }

  async evolveStrategy(feedback = '') {
    try {
      const projectId = await this.projectManagement.requireActiveProject();
      const config = await this.dataPersistence.loadProjectData(projectId, 'config.json');
      
      if (!config) {
        throw new Error(`Project configuration not found for project '${projectId}' in evolveStrategy. Check if config.json exists and is valid.`);
      }

      const activePath = config.activePath || 'general';
      const analysis = await this.analyzeCurrentStrategy(projectId, activePath, feedback);
      const newTasks = await this.generateSmartNextTasks(projectId, activePath, analysis);
      
      // Update HTA tree with new tasks
      if (newTasks.length > 0) {
        const htaData = await this.loadPathHTA(projectId, activePath) || {};
        htaData.frontierNodes = (htaData.frontierNodes || []).concat(newTasks);
        htaData.lastUpdated = new Date().toISOString();
        await this.savePathHTA(projectId, activePath, htaData);
      }

      const responseText = this.formatStrategyEvolutionResponse(analysis, newTasks, feedback);
      
      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        strategy_analysis: analysis,
        new_tasks: newTasks,
        feedback_processed: feedback || 'none'
      };
    } catch (error) {
      await this.dataPersistence.logError('evolveStrategy', error, { feedback });
      return {
        content: [{
          type: 'text',
          text: `Error evolving strategy: ${error.message}`
        }]
      };
    }
  }

  selectOptimalTask(htaData, energyLevel, timeAvailable, contextFromMemory, projectContext) {
    const nodes = htaData.frontierNodes || [];
    
    // Pre-compute completed node IDs as a Set for O(1) lookup
    const completedNodeIds = new Set(nodes.filter(n => n.completed).map(n => n.id));
    
    // Create a map for fast node lookup by title (for legacy prerequisite support)
    const nodesByTitle = new Map();
    for (const node of nodes) {
      if (node.completed) {
        nodesByTitle.set(node.title, node);
      }
    }
    
    // Filter available tasks (not completed, prerequisites met)
    const availableTasks = [];
    for (const node of nodes) {
      if (node.completed) {
        continue;
      }
      
      // Check prerequisites efficiently
      if (node.prerequisites && node.prerequisites.length > 0) {
        let prerequisitesMet = true;
        for (const prereq of node.prerequisites) {
          if (!completedNodeIds.has(prereq) && !nodesByTitle.has(prereq)) {
            prerequisitesMet = false;
            break;
          }
        }
        if (!prerequisitesMet) {
          continue;
        }
      }
      
      // availability (more than 120% of available time).  This prevents the
      // system from suggesting 20-minute tasks for a 10-minute slot.
      const timeInMinutes = this.parseTimeToMinutes(timeAvailable);
      const taskMinutes = this.parseTimeToMinutes(node.duration || '30 minutes');
      if (taskMinutes > timeInMinutes * 1.2) {
        continue; // Too long – try another task
      }
      
      availableTasks.push(node);
    }

    if (availableTasks.length === 0) {
      return null;
    }

    // Parse time available once
    const timeInMinutes = this.parseTimeToMinutes(timeAvailable);
    
    // Score and find best task in single pass
    let bestTask = null;
    let bestScore = -Infinity;
    
    for (const task of availableTasks) {
      const score = this.calculateTaskScore(task, energyLevel, timeInMinutes, contextFromMemory, projectContext);
      if (score > bestScore) {
        bestScore = score;
        bestTask = { ...task, score };
      }
    }
    
    return bestTask;
  }

  calculateTaskScore(task, energyLevel, timeInMinutes, contextFromMemory, projectContext) {
    let score = task.priority || 200;

    // Energy level matching
    const taskDifficulty = task.difficulty || 3;
    const energyMatch = 5 - Math.abs(energyLevel - taskDifficulty);
    score += energyMatch * 20;

    // CRITICAL FIX: Better time constraint handling
    const taskDuration = this.parseTimeToMinutes(task.duration || '30 minutes');
    
    if (timeInMinutes >= taskDuration) {
      // Task fits perfectly within time constraint
      score += 50;
    } else if (timeInMinutes >= taskDuration * 0.8) {
      // Task is slightly longer but could be adapted
      score += 20;
    } else if (timeInMinutes >= taskDuration * 0.5) {
      // Task is much longer but could be partially completed
      score -= 20;
    } else {
      // Task is way too long
      score -= 100;
    }

    // Domain context relevance
    if (this.isDomainRelevant(task, projectContext)) {
      score += 100;
    }

    // Context relevance from memory
    if (contextFromMemory && this.isContextRelevant(task, contextFromMemory)) {
      score += 50;
    }

    // Breakthrough potential
    if (task.opportunityType === 'breakthrough_amplification') {
      score += 100;
    }

    // Recently generated tasks get boost
    if (task.generated) {
      score += 25;
    }

    return score;
  }

  isDomainRelevant(task, projectContext) {
    const taskText = (task.title + ' ' + task.description).toLowerCase();
    const domainText = (projectContext.goal + ' ' + projectContext.domain).toLowerCase();
    
    // Extract domain-specific keywords
    const domainKeywords = domainText.split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['research', 'learning', 'study', 'project'].includes(word));
    
    // Check if task contains domain-specific terminology
    return domainKeywords.some(keyword => taskText.includes(keyword));
  }

  isContextRelevant(task, context) {
    const taskText = (task.title + ' ' + task.description).toLowerCase();

    // Gracefully handle non-string context values (objects, arrays, etc.)
    let contextStr;
    if (typeof context === 'string') {
      contextStr = context;
    } else if (context === null || context === undefined) {
      contextStr = '';
    } else {
      try {
        contextStr = JSON.stringify(context);
      } catch {
        contextStr = String(context);
      }
    }

    const contextLower = contextStr.toLowerCase();

    // Simple keyword matching - could be enhanced with NLP
    const keywords = contextLower.split(/\W+/).filter(word => word.length > 3);
    return keywords.some(keyword => taskText.includes(keyword));
  }

  async analyzeCurrentStrategy(projectId, pathName, feedback) {
    const htaData = await this.loadPathHTA(projectId, pathName) || {};
    const learningHistory = await this.loadLearningHistory(projectId, pathName) || {};
    
    const analysis = {
      completedTasks: htaData.frontierNodes?.filter(n => n.completed).length || 0,
      totalTasks: htaData.frontierNodes?.length || 0,
      availableTasks: this.getAvailableTasksCount(htaData),
      stuckIndicators: this.detectStuckIndicators(htaData, learningHistory),
      userFeedback: this.analyzeFeedback(feedback),
      recommendedEvolution: null
    };

    // Determine evolution strategy
    analysis.recommendedEvolution = this.determineEvolutionStrategy(analysis);
    
    return analysis;
  }

  getAvailableTasksCount(htaData) {
    const nodes = htaData.frontierNodes || [];
    const completedNodeIds = nodes.filter(n => n.completed).map(n => n.id);
    
    return nodes.filter(node => {
      if (node.completed) {return false;}
      
      if (node.prerequisites && node.prerequisites.length > 0) {
        return node.prerequisites.every(prereq => 
          completedNodeIds.includes(prereq) || 
          nodes.some(n => n.title === prereq && n.completed)
        );
      }
      
      return true;
    }).length;
  }

  detectStuckIndicators(htaData, learningHistory) {
    const indicators = [];
    
    // No available tasks
    if (this.getAvailableTasksCount(htaData) === 0) {
      indicators.push('no_available_tasks');
    }
    
    // No recent completions
    const recentCompletions = learningHistory.completedTopics?.filter(t => {
      const daysDiff = (Date.now() - new Date(t.completedAt)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }) || [];
    
    if (recentCompletions.length === 0) {
      indicators.push('no_recent_progress');
    }
    
    // Low engagement
    const avgEngagement = recentCompletions.reduce((sum, c) => sum + (c.energyAfter || 3), 0) / Math.max(recentCompletions.length, 1);
    if (avgEngagement < 2.5) {
      indicators.push('low_engagement');
    }
    
    return indicators;
  }

  analyzeFeedback(feedback) {
    if (!feedback) {return { sentiment: 'neutral', keywords: [] };}
    
    const feedbackLower = feedback.toLowerCase();

    const positiveWords = ['great', 'interesting', 'progress', 'excellent', 'perfect', 'energized', 'proud', 'good', 'working'];
    const negativeWords = ['boring', 'stuck', 'difficult', 'difficulty', 'frustrated', 'overwhelmed', 'bad', 'problem'];

    const positiveCount = positiveWords.filter(w => feedbackLower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => feedbackLower.includes(w)).length;

    let sentiment = 'neutral';
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
    }

    const keywords = feedback.split(/\s+/).filter(word => word.length > 3);

    return { sentiment, keywords, original: feedback };
  }

  determineEvolutionStrategy(analysis) {
    if (analysis.stuckIndicators.includes('no_available_tasks')) {
      return 'generate_new_tasks';
    }
    
    if (analysis.stuckIndicators.includes('low_engagement')) {
      return 'increase_variety_and_interest';
    }
    
    if (analysis.userFeedback.sentiment === 'negative') {
      return 'address_user_concerns';
    }
    
    if (analysis.availableTasks < 3) {
      return 'expand_task_frontier';
    }
    
    return 'optimize_existing_sequence';
  }

  async generateSmartNextTasks(projectId, pathName, analysis) {
    const config = await this.dataPersistence.loadProjectData(projectId, 'config.json');
    const htaData = await this.loadPathHTA(projectId, pathName) || {};
    
    const newTasks = [];
    const taskId = (htaData.frontierNodes?.length || 0) + 3000;
    
    const strategy = analysis.recommendedEvolution;
    
    switch (strategy) {
      case 'generate_new_tasks':
        newTasks.push(...this.generateExplorationTasks(config, taskId));
        break;
        
      case 'increase_variety_and_interest':
        newTasks.push(...this.generateInterestBasedTasks(config, taskId));
        break;
        
      case 'address_user_concerns':
        newTasks.push(...this.generateConcernAddressingTasks(analysis.userFeedback, taskId));
        break;
        
      case 'expand_task_frontier':
        newTasks.push(...this.generateProgressiveTasks(htaData, taskId));
        break;
        
      default:
        newTasks.push(...this.generateBalancedTasks(config, htaData, taskId));
    }
    
    return newTasks.slice(0, 5); // Limit to 5 new tasks at a time
  }

  generateExplorationTasks(config, startId) {
    const goal = config.goal || 'learning';
    
    return [
      {
        id: `explore_${startId}`,
        title: `Explore: What's Next in ${goal}`,
        description: 'Open exploration of next steps and possibilities',
        difficulty: 1,
        duration: '15 minutes',
        branch: 'exploration',
        priority: 250,
        generated: true,
        learningOutcome: 'Clarity on next learning directions'
      },
      {
        id: `sample_${startId + 1}`,
        title: 'Sample: Try Something Different',
        description: 'Experiment with a new approach or technique',
        difficulty: 2,
        duration: '25 minutes',
        branch: 'experimentation',
        priority: 240,
        generated: true,
        learningOutcome: 'Experience with alternative approaches'
      }
    ];
  }

  generateInterestBasedTasks(config, startId) {
    const interests = config.specific_interests || [];
    const tasks = [];
    
    for (let i = 0; i < Math.min(3, interests.length); i++) {
      const interest = interests[i];
      tasks.push({
        id: `interest_${startId + i}`,
        title: `Focus: ${interest}`,
        description: `Dedicated work on your specific interest: ${interest}`,
        difficulty: 2,
        duration: '30 minutes',
        branch: 'interests',
        priority: 300, // High priority for interests
        generated: true,
        learningOutcome: `Progress in ${interest}`
      });
    }
    
    return tasks;
  }

  generateConcernAddressingTasks(feedback, startId) {
    return [
      {
        id: `address_${startId}`,
        title: 'Address: Current Challenge',
        description: `Work on overcoming the challenge: ${feedback.original}`,
        difficulty: 1,
        duration: '20 minutes',
        branch: 'problem_solving',
        priority: 280,
        generated: true,
        learningOutcome: 'Resolution of current learning obstacle'
      }
    ];
  }

  generateProgressiveTasks(htaData, startId) {
    const completedTasks = htaData.frontierNodes?.filter(n => n.completed) || [];
    const lastCompleted = completedTasks[completedTasks.length - 1];
    
    if (!lastCompleted) {
      return this.generateExplorationTasks({ goal: 'general learning' }, startId);
    }
    
    return [
      {
        id: `build_${startId}`,
        title: `Build On: ${lastCompleted.title}`,
        description: `Continue building on the foundation from ${lastCompleted.title}`,
        difficulty: Math.min(5, (lastCompleted.difficulty || 3) + 1),
        duration: '35 minutes',
        branch: lastCompleted.branch || 'progression',
        prerequisites: [lastCompleted.id],
        priority: 270,
        generated: true,
        learningOutcome: `Advanced understanding beyond ${lastCompleted.title}`
      }
    ];
  }

  generateBalancedTasks(config, htaData, startId) {
    // No hard-coded fallback – signal external generation required
    return [];
  }

  formatTaskResponse(task, energyLevel, timeAvailable) {
    const difficultyStars = '⭐'.repeat(task.difficulty || 1);
    const duration = task.duration || '30 minutes';
    
    let response = `🎯 **Next Recommended Task**\n\n`;
    response += `**${task.title}**\n`;
    response += `${task.description || 'No description available'}\n\n`;
    response += `⏱️ **Duration**: ${duration}\n`;
    response += `${difficultyStars} **Difficulty**: ${task.difficulty || 1}/5\n`;
    response += `🎯 **Branch**: ${task.branch || 'general'}\n`;
    
    if (task.learningOutcome) {
      response += `📈 **Learning Outcome**: ${task.learningOutcome}\n`;
    }
    
    response += `\n⚡ **Energy Match**: ${this.getEnergyMatchText(task.difficulty || 3, energyLevel)}\n`;
    response += `⏰ **Time Match**: ${this.getTimeMatchText(duration, timeAvailable)}\n`;
    
    response += `\n✅ Use \`complete_block\` with block_id: "${task.id}" when finished`;
    
    return response;
  }

  getEnergyMatchText(taskDifficulty, energyLevel) {
    const diff = Math.abs(taskDifficulty - energyLevel);
    if (diff <= 1) {return 'Excellent match';}
    if (diff <= 2) {return 'Good match';}
    return 'Consider adjusting energy or task difficulty';
  }

  getTimeMatchText(taskDuration, timeAvailable) {
    const taskMinutes = this.parseTimeToMinutes(taskDuration);
    const availableMinutes = this.parseTimeToMinutes(timeAvailable);
    
    if (taskMinutes <= availableMinutes) {
      return 'Perfect fit ✅';
    } else if (taskMinutes <= availableMinutes * 1.2) {
      return 'Close fit (consider extending slightly)';
    } else if (taskMinutes <= availableMinutes * 1.5) {
      const adaptation = Math.round(availableMinutes * 0.8);
      return `Too long - try for ${adaptation} minutes instead`;
    } else {
      const adaptation = Math.round(availableMinutes * 0.8);
      return `Much too long - do first ${adaptation} minutes only`;
    }
  }

  formatStrategyEvolutionResponse(analysis, newTasks, feedback) {
    let response = `🧠 **Strategy Evolution Complete**\n\n`;
    
    response += `📊 **Current Status**:\n`;
    response += `• Completed tasks: ${analysis.completedTasks}/${analysis.totalTasks}\n`;
    response += `• Available tasks: ${analysis.availableTasks}\n`;
    
    if (analysis.stuckIndicators.length > 0) {
      response += `• Detected issues: ${analysis.stuckIndicators.join(', ')}\n`;
    }
    
    response += `\n🎯 **Evolution Strategy**: ${analysis.recommendedEvolution.replace(/_/g, ' ')}\n`;
    
    if (newTasks.length > 0) {
      response += `\n✨ **New Tasks Generated** (${newTasks.length}):\n`;
      for (const task of newTasks.slice(0, 3)) {
        response += `• ${task.title} (${task.duration || '30 min'})\n`;
      }
      
      if (newTasks.length > 3) {
        response += `• ... and ${newTasks.length - 3} more\n`;
      }
    }
    
    if (feedback) {
      response += `\n💬 **Feedback Processed**: ${analysis.userFeedback.sentiment} sentiment detected\n`;
    }
    
    response += `\n🚀 **Next Step**: Use \`get_next_task\` to get your optimal next task`;
    
    return response;
  }

  parseTimeToMinutes(timeStr) {
    const matches = timeStr.match(/(\d+)\s*(minute|hour|min|hr)/i);
    if (!matches) {return 30;}
    
    const value = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();
    
    return unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value;
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

  async loadLearningHistory(projectId, pathName) {
    if (pathName === 'general') {
      return await this.dataPersistence.loadProjectData(projectId, 'learning_history.json');
    } else {
      return await this.dataPersistence.loadPathData(projectId, pathName, 'learning_history.json');
    }
  }
}