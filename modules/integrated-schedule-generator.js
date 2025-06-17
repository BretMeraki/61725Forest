// Integrated Schedule Generator
// Builds a daily integrated schedule by asking Claude to allocate tasks into free blocks.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class IntegratedScheduleGenerator {
  /**
   * @param {import('./integrated-task-pool.js').IntegratedTaskPool} taskPool
   * @param {import('../modules/project-management.js').ProjectManagement} projectManagement
   * @param {any} llmInterface  // Claude interface from CoreInfrastructure
   * @param {import('../modules/data-persistence.js').DataPersistence} dataPersistence
   * @param {import('../modules/schedule-generator.js').ScheduleGenerator} scheduleGenerator
   */
  constructor(taskPool, projectManagement, llmInterface, dataPersistence, scheduleGenerator) {
    this.taskPool = taskPool;
    this.projectManagement = projectManagement;
    this.llm = llmInterface;
    this.dataPersistence = dataPersistence;
    this.scheduleGenerator = scheduleGenerator;
  }

  /**
   * Main entry point for MCP tool.
   * @param {string|null} dateStr
   * @param {number} energyLevel
   */
  async generateIntegratedSchedule(dateStr = null, energyLevel = 3) {
    const date = dateStr || new Date().toISOString().split('T')[0];

    // Collect tasks from all projects
    const tasks = await this.taskPool.getTaskPool(25);
    if (tasks.length === 0) {
      return { content:[{type:'text', text:'⚠️ No available tasks across active projects.'}] };
    }

    // Build free-block list from the active project template (takes first project with prefs)
    const projects = await this.projectManagement.listProjects();
    if (projects.length === 0) {
      return { content:[{type:'text', text:'⚠️ No active projects found.'}] };
    }
    const primaryProjectId = typeof projects[0] === 'string' ? projects[0] : projects[0].id;
    const primaryConfig = await this.dataPersistence.loadProjectData(primaryProjectId, 'config.json');
    const prefs = primaryConfig.life_structure_preferences || {};
    const wake = this._parseTime(prefs.wake_time || '7:00 AM');
    const sleep = this._parseTime(prefs.sleep_time || '10:00 PM');

    // Simple free-blocks: entire day as one block for now (can refine later)
    const freeBlocks = [{ start:this._formatTime(wake), end:this._formatTime(sleep) }];

    // Build prompt
    const prompt = `You are an intelligent scheduler. Place tasks into the free blocks so that they fit within the block length and match the user's energy level. Output JSON array of {task_id,start,end,project_id}. If a task is longer than remaining time, skip it.`;

    const contextPayload = {
      date,
      energy_level: energyLevel,
      free_blocks: freeBlocks,
      tasks
    };

    const llmResp = await this.llm.requestIntelligence('integrated-schedule', { prompt:`${prompt}\n\nContext JSON:\n${JSON.stringify(contextPayload)}` });

    let scheduleArr = [];
    try {
      scheduleArr = JSON.parse(llmResp.completion || llmResp.answer || llmResp.text || '[]');
    } catch(_) {/* ignore parse errors */}

    // Basic validation: ensure each entry has task_id
    scheduleArr = Array.isArray(scheduleArr) ? scheduleArr.filter(x=>x.task_id) : [];

    // Store per project day files
    const byProject = {};
    for (const entry of scheduleArr) {
      if (!byProject[entry.project_id]) {byProject[entry.project_id] = [];} 
      byProject[entry.project_id].push(entry);
    }
    for (const [projectId, blocks] of Object.entries(byProject)) {
      const fileName = `day_${date}.json`;
      await this.dataPersistence.saveProjectData(projectId, fileName, { date, blocks, generated:new Date().toISOString() });
    }

    return {
      content:[{ type:'text', text:`🗓️ Integrated schedule generated for ${date} with ${scheduleArr.length} tasks.`}],
      schedule: scheduleArr,
      free_blocks: freeBlocks,
      task_count: tasks.length
    };
  }

  _parseTime(str) {
    const [h, m] = str.replace(/\s*AM|\s*PM/i,'').split(':').map(Number);
    return h*60 + (m||0);
  }

  _formatTime(minutes) {
    const h = Math.floor(minutes/60).toString().padStart(2,'0');
    const m = (minutes%60).toString().padStart(2,'0');
    return `${h}:${m}`;
  }
} 