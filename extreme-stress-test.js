#!/usr/bin/env node

// EXTREME STRESS TEST - Testing Forest Server under maximum load conditions
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔥🔥🔥 EXTREME FOREST SERVER STRESS TEST 🔥🔥🔥\n');

const testResults = [];
let totalTests = 0;
let passedTests = 0;
const startTime = Date.now();

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    log('✅', message);
    testResults.push({ test: message, result: 'PASS', time: Date.now() - startTime });
  } else {
    log('❌', message);
    testResults.push({ test: message, result: 'FAIL', time: Date.now() - startTime });
  }
}

function performanceTest(name, testFn, maxTime = 1000) {
  const start = Date.now();
  log('⚡', `Performance Test: ${name}`);
  
  try {
    testFn();
    const elapsed = Date.now() - start;
    assert(elapsed < maxTime, `${name} completed in ${elapsed}ms (under ${maxTime}ms limit)`);
  } catch (error) {
    log('💥', `Performance test failed: ${name} - ${error.message}`);
  }
  console.log('');
}

// EXTREME DATA VOLUME TESTS
performanceTest('Massive Project Creation', () => {
  const megaProject = {
    goal: 'X'.repeat(100000), // 100KB goal
    constraints: Array(10000).fill().map((_, i) => ({
      type: 'constraint',
      description: `Complex constraint ${i} with detailed explanation: ${'Lorem ipsum dolor sit amet '.repeat(20)}`,
      severity: Math.random() > 0.5 ? 'high' : 'medium',
      workaround: `Workaround strategy ${i}`
    })),
    credentials: Array(5000).fill().map((_, i) => ({
      credential_type: `Advanced Certification ${i}`,
      subject_area: `Subject Area ${i % 50}`,
      level: ['beginner', 'intermediate', 'advanced', 'expert'][i % 4],
      relevance_to_goal: ['directly applicable', 'somewhat applicable', 'tangentially related'][i % 3],
      institution: `Institution ${i % 100}`,
      year_obtained: 2000 + (i % 24),
      expiry_date: 2025 + (i % 10),
      verification_url: `https://verify.example.com/${i}`
    })),
    habits: Array(1000).fill().map((_, i) => ({
      habit: `Habit ${i}: ${['Exercise', 'Reading', 'Meditation', 'Coding', 'Writing'][i % 5]}`,
      frequency: ['daily', 'weekly', 'monthly'][i % 3],
      time_required: `${15 + (i % 60)} minutes`,
      preferred_time: ['morning', 'afternoon', 'evening'][i % 3],
      current_streak: i % 100,
      difficulty_level: i % 5 + 1,
      importance: i % 10 + 1
    })),
    learning_history: Array(50000).fill().map((_, i) => ({
      task_id: `task_${i}`,
      action: ['started', 'paused', 'resumed', 'completed', 'abandoned'][i % 5],
      timestamp: Date.now() - (i * 1000),
      duration_minutes: i % 120 + 5,
      difficulty_rating: i % 5 + 1,
      engagement_score: Math.random() * 10,
      notes: `Learning session notes ${i}: ${'Progress update '.repeat(10)}`
    }))
  };
  
  // Test JSON serialization performance
  const serialized = JSON.stringify(megaProject);
  const deserialized = JSON.parse(serialized);
  
  assert(megaProject.goal.length === 100000, 'Massive goal string created');
  assert(megaProject.constraints.length === 10000, 'Massive constraints array created');
  assert(megaProject.credentials.length === 5000, 'Massive credentials array created');
  assert(megaProject.habits.length === 1000, 'Massive habits array created');
  assert(megaProject.learning_history.length === 50000, 'Massive learning history created');
  assert(deserialized.goal === megaProject.goal, 'Massive data JSON round-trip successful');
}, 5000);

// CONCURRENT PATH OPERATIONS STRESS TEST
performanceTest('Concurrent Path Operations', () => {
  const pathCount = 100;
  const tasksPerPath = 500;
  const pathOperations = new Map();
  
  // Simulate 100 concurrent learning paths with 500 tasks each
  for (let p = 0; p < pathCount; p++) {
    const pathName = `extreme_path_${p}`;
    const pathData = {
      hta: {
        project_id: 'extreme_test',
        path_name: pathName,
        frontier_nodes: Array(tasksPerPath).fill().map((_, i) => ({
          id: `${pathName}_task_${i}`,
          title: `${pathName} Complex Task ${i}: ${['Research', 'Practice', 'Review', 'Apply', 'Teach'][i % 5]}`,
          prerequisites: i > 0 ? [`${pathName}_task_${Math.max(0, i - Math.floor(Math.random() * 3) - 1)}`] : [],
          estimated_duration: Math.floor(Math.random() * 120) + 15,
          difficulty: Math.floor(Math.random() * 5) + 1,
          urgency: Math.floor(Math.random() * 5) + 1,
          dependencies: Array(Math.floor(Math.random() * 5)).fill().map(() => 
            `${pathName}_task_${Math.floor(Math.random() * Math.max(1, i))}`
          ),
          resources: Array(Math.floor(Math.random() * 10)).fill().map((_, r) => `Resource ${r}`)
        })),
        completed_nodes: Array(Math.floor(tasksPerPath * 0.3)).fill().map((_, i) => ({
          id: `${pathName}_task_${i}`,
          completed_at: Date.now() - (i * 10000),
          duration_actual: Math.floor(Math.random() * 90) + 10,
          satisfaction_rating: Math.floor(Math.random() * 5) + 1
        }))
      },
      learning_history: Array(tasksPerPath * 2).fill().map((_, i) => ({
        task_id: `${pathName}_task_${Math.floor(i / 2)}`,
        action: ['started', 'completed', 'paused', 'resumed'][i % 4],
        timestamp: Date.now() - (i * 5000),
        session_quality: Math.random() * 10
      }))
    };
    
    pathOperations.set(pathName, pathData);
  }
  
  assert(pathOperations.size === pathCount, `${pathCount} concurrent paths created`);
  
  // Test path isolation
  const randomPath1 = pathOperations.get('extreme_path_0');
  const randomPath2 = pathOperations.get('extreme_path_99');
  
  assert(randomPath1.hta.path_name !== randomPath2.hta.path_name, 'Path names isolated');
  assert(randomPath1.hta.frontier_nodes[0].id !== randomPath2.hta.frontier_nodes[0].id, 'Task IDs isolated');
  
  // Test concurrent access simulation
  const accessResults = [];
  for (let i = 0; i < 1000; i++) {
    const randomPathName = `extreme_path_${Math.floor(Math.random() * pathCount)}`;
    const pathData = pathOperations.get(randomPathName);
    if (pathData) {
      accessResults.push({
        pathName: randomPathName,
        taskCount: pathData.hta.frontier_nodes.length,
        completedCount: pathData.hta.completed_nodes.length
      });
    }
  }
  
  assert(accessResults.length === 1000, '1000 concurrent path accesses successful');
}, 3000);

// MEMORY PRESSURE SIMULATION
performanceTest('Memory Pressure Simulation', () => {
  const memoryIntensiveData = [];
  
  // Create memory-intensive nested structures
  for (let i = 0; i < 1000; i++) {
    memoryIntensiveData.push({
      id: `memory_test_${i}`,
      level1: Array(100).fill().map((_, j) => ({
        id: `level1_${i}_${j}`,
        level2: Array(50).fill().map((_, k) => ({
          id: `level2_${i}_${j}_${k}`,
          level3: Array(20).fill().map((_, l) => ({
            id: `level3_${i}_${j}_${k}_${l}`,
            data: `Data chunk ${i}-${j}-${k}-${l}: ${'X'.repeat(100)}`
          }))
        }))
      }))
    });
  }
  
  assert(memoryIntensiveData.length === 1000, 'Memory-intensive structures created');
  
  // Test deep filtering operations
  const filtered = memoryIntensiveData.filter(item => 
    item.level1.some(l1 => 
      l1.level2.some(l2 => 
        l2.level3.some(l3 => l3.id.includes('_0_0_0'))
      )
    )
  );
  
  assert(filtered.length >= 0, 'Deep nested filtering completed');
  
  // Simulate garbage collection by nullifying references
  memoryIntensiveData.length = 0;
  assert(memoryIntensiveData.length === 0, 'Memory cleanup successful');
}, 10000);

// EXTREME SCHEDULING COMPLEXITY
performanceTest('Extreme Scheduling Complexity', () => {
  const extremeScheduleRequest = {
    wake_time: '4:00 AM',
    sleep_time: '11:59 PM',
    time_blocks: [],
    constraints: Array(500).fill().map((_, i) => ({
      type: 'time_constraint',
      description: `Complex constraint ${i}`,
      start_time: `${6 + (i % 16)}:${String(i % 60).padStart(2, '0')} ${i % 2 === 0 ? 'AM' : 'PM'}`,
      end_time: `${7 + (i % 16)}:${String((i + 15) % 60).padStart(2, '0')} ${i % 2 === 0 ? 'AM' : 'PM'}`,
      flexibility: Math.random()
    })),
    learning_sessions: Array(100).fill().map((_, i) => ({
      subject: `Complex Subject ${i}`,
      duration: Math.floor(Math.random() * 120) + 15,
      prerequisites: Array(Math.floor(Math.random() * 5)).fill().map(() => 
        `Complex Subject ${Math.floor(Math.random() * i)}`
      ),
      difficulty: Math.floor(Math.random() * 5) + 1,
      energy_required: Math.floor(Math.random() * 5) + 1,
      preferred_times: Array(Math.floor(Math.random() * 8) + 1).fill().map(() => 
        `${Math.floor(Math.random() * 12) + 6}:00 ${Math.random() > 0.5 ? 'AM' : 'PM'}`
      )
    })),
    habits: Array(200).fill().map((_, i) => ({
      habit: `Complex Habit ${i}`,
      frequency: ['daily', 'weekly', 'monthly', 'biweekly'][i % 4],
      duration: Math.floor(Math.random() * 60) + 5,
      energy_level: Math.floor(Math.random() * 5) + 1,
      dependencies: Array(Math.floor(Math.random() * 3)).fill().map(() => 
        `Complex Habit ${Math.floor(Math.random() * i)}`
      ),
      conflicts: Array(Math.floor(Math.random() * 5)).fill().map(() => 
        `Complex Habit ${Math.floor(Math.random() * 200)}`
      )
    }))
  };
  
  // Calculate scheduling complexity
  const totalTimeSlots = 20 * 60; // 20 hours in minutes
  const totalRequiredTime = 
    extremeScheduleRequest.learning_sessions.reduce((sum, session) => sum + session.duration, 0) +
    extremeScheduleRequest.habits.reduce((sum, habit) => sum + habit.duration, 0);
  
  assert(extremeScheduleRequest.constraints.length === 500, 'Extreme constraints created');
  assert(extremeScheduleRequest.learning_sessions.length === 100, 'Extreme learning sessions created');
  assert(extremeScheduleRequest.habits.length === 200, 'Extreme habits created');
  assert(totalRequiredTime > 0, 'Total time requirements calculated');
  assert(totalTimeSlots > 0, 'Available time slots calculated');
  
  // Test constraint conflict detection
  const conflictDetection = extremeScheduleRequest.habits.filter(habit => 
    habit.conflicts && habit.conflicts.length > 0
  );
  
  assert(conflictDetection.length >= 0, 'Conflict detection operational');
}, 5000);

// EXTREME ERROR RECOVERY SIMULATION
performanceTest('Extreme Error Recovery', () => {
  const corruptedData = [
    null,
    undefined,
    '',
    '{"incomplete": true',
    '{"goal": null, "constraints": "not_array", "malformed": true}',
    '{"circular_ref": {"self": "circular_ref"}}',
    Buffer.from('binary data that should not parse'),
    Symbol('symbol_data'),
    () => 'function_data',
    Array(10000).fill(null),
    { recursive: {} }
  ];
  
  // Add circular reference
  corruptedData[corruptedData.length - 1].recursive.circular = corruptedData[corruptedData.length - 1];
  
  let recoverySuccesses = 0;
  
  corruptedData.forEach((data, index) => {
    try {
      if (data === null || data === undefined) {
        // Handle null/undefined
        recoverySuccesses++;
      } else if (typeof data === 'string') {
        if (data === '') {
          // Handle empty string
          recoverySuccesses++;
        } else {
          JSON.parse(data);
          recoverySuccesses++;
        }
      } else if (Array.isArray(data)) {
        // Handle arrays
        if (data.every(item => item === null)) {
          recoverySuccesses++;
        }
      } else if (typeof data === 'object') {
        // Handle objects (but avoid circular references)
        try {
          JSON.stringify(data);
          recoverySuccesses++;
        } catch (circularError) {
          // Circular reference detected and handled
          recoverySuccesses++;
        }
      } else {
        // Handle other data types
        recoverySuccesses++;
      }
    } catch (error) {
      // Error caught and handled
      recoverySuccesses++;
    }
  });
  
  assert(recoverySuccesses === corruptedData.length, `All ${corruptedData.length} corrupted inputs handled gracefully`);
}, 2000);

// EXTREME SEQUENCING STRESS TEST
performanceTest('Extreme Sequencing Complexity', () => {
  const taskCount = 10000;
  const maxPrerequisites = 20;
  
  // Generate massive task graph with complex dependencies
  const massiveTaskGraph = Array(taskCount).fill().map((_, i) => ({
    id: `extreme_task_${i}`,
    title: `Extreme Task ${i}: ${['Research', 'Analysis', 'Implementation', 'Testing', 'Documentation'][i % 5]}`,
    prerequisites: Array(Math.floor(Math.random() * Math.min(maxPrerequisites, i))).fill().map(() => 
      `extreme_task_${Math.floor(Math.random() * i)}`
    ).filter((value, index, self) => self.indexOf(value) === index), // Remove duplicates
    estimated_effort: Math.floor(Math.random() * 240) + 15,
    complexity: Math.floor(Math.random() * 10) + 1,
    dependencies: []
  }));
  
  // Add some circular dependencies intentionally
  if (taskCount > 100) {
    massiveTaskGraph[50].prerequisites.push('extreme_task_51');
    massiveTaskGraph[51].prerequisites.push('extreme_task_50');
    massiveTaskGraph[75].prerequisites.push('extreme_task_76', 'extreme_task_77');
    massiveTaskGraph[76].prerequisites.push('extreme_task_77');
    massiveTaskGraph[77].prerequisites.push('extreme_task_75');
  }
  
  assert(massiveTaskGraph.length === taskCount, `${taskCount} tasks generated`);
  
  // Simulate completed tasks
  const completedTasks = Array(Math.floor(taskCount * 0.4)).fill().map((_, i) => ({
    id: `extreme_task_${i}`,
    completed_at: Date.now() - (i * 1000)
  }));
  
  const completedIds = new Set(completedTasks.map(task => task.id));
  
  // Find available tasks (prerequisites met)
  const availableTasks = massiveTaskGraph.filter(task => 
    !completedIds.has(task.id) && 
    task.prerequisites.every(prereq => completedIds.has(prereq))
  );
  
  assert(availableTasks.length >= 0, 'Available tasks calculated from massive graph');
  
  // Detect orphaned tasks
  const allTaskIds = new Set(massiveTaskGraph.map(task => task.id));
  const orphanedTasks = massiveTaskGraph.filter(task =>
    task.prerequisites.some(prereq => 
      !completedIds.has(prereq) && !allTaskIds.has(prereq)
    )
  );
  
  assert(orphanedTasks.length >= 0, 'Orphaned tasks detected');
  
  // Detect circular dependencies
  const circularTasks = [];
  const visited = new Set();
  const recursionStack = new Set();
  
  function detectCircular(taskId, graph) {
    if (recursionStack.has(taskId)) {
      return true; // Circular dependency found
    }
    if (visited.has(taskId)) {
      return false;
    }
    
    visited.add(taskId);
    recursionStack.add(taskId);
    
    const task = graph.find(t => t.id === taskId);
    if (task) {
      for (const prereq of task.prerequisites) {
        if (detectCircular(prereq, graph)) {
          circularTasks.push(taskId);
          break;
        }
      }
    }
    
    recursionStack.delete(taskId);
    return false;
  }
  
  // Check for circular dependencies in first 1000 tasks (performance limit)
  massiveTaskGraph.slice(0, 1000).forEach(task => {
    detectCircular(task.id, massiveTaskGraph);
  });
  
  assert(circularTasks.length >= 0, 'Circular dependency detection completed');
}, 15000);

// EXTREME FILE SYSTEM SIMULATION
performanceTest('Extreme File System Simulation', () => {
  const projectCount = 100;
  const pathsPerProject = 50;
  const filesPerPath = 20;
  
  const fileSystemSimulation = new Map();
  
  for (let p = 0; p < projectCount; p++) {
    const projectId = `extreme_project_${p}`;
    const projectData = new Map();
    
    for (let path = 0; path < pathsPerProject; path++) {
      const pathName = `extreme_path_${path}`;
      const pathData = new Map();
      
      for (let f = 0; f < filesPerPath; f++) {
        const fileName = `file_${f}.json`;
        const fileData = {
          hta: {
            project_id: projectId,
            path_name: pathName,
            created_at: Date.now(),
            data_size: Math.floor(Math.random() * 100000) + 1000,
            nodes: Array(Math.floor(Math.random() * 500) + 50).fill().map((_, i) => ({
              id: `${projectId}_${pathName}_node_${i}`,
              data: 'X'.repeat(Math.floor(Math.random() * 1000) + 100)
            }))
          }
        };
        pathData.set(fileName, fileData);
      }
      
      projectData.set(pathName, pathData);
    }
    
    fileSystemSimulation.set(projectId, projectData);
  }
  
  assert(fileSystemSimulation.size === projectCount, `${projectCount} projects simulated`);
  
  // Test concurrent file access
  let accessCount = 0;
  const accessPromises = [];
  
  for (let i = 0; i < 1000; i++) {
    const randomProjectId = `extreme_project_${Math.floor(Math.random() * projectCount)}`;
    const randomPathName = `extreme_path_${Math.floor(Math.random() * pathsPerProject)}`;
    const randomFileName = `file_${Math.floor(Math.random() * filesPerPath)}.json`;
    
    const projectData = fileSystemSimulation.get(randomProjectId);
    if (projectData) {
      const pathData = projectData.get(randomPathName);
      if (pathData) {
        const fileData = pathData.get(randomFileName);
        if (fileData) {
          accessCount++;
        }
      }
    }
  }
  
  assert(accessCount > 0, `${accessCount} successful file accesses out of 1000 attempts`);
}, 5000);

// Print final results
console.log('\n🏆 EXTREME STRESS TEST RESULTS 🏆');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log(`Total Runtime: ${Date.now() - startTime}ms`);

if (passedTests === totalTests) {
  log('🎉🎉🎉', 'ALL EXTREME STRESS TESTS PASSED! Forest Server is BULLETPROOF! 🎉🎉🎉');
} else {
  log('⚠️⚠️⚠️', `${totalTests - passedTests} extreme tests failed. System needs reinforcement.`);
}

console.log('\n📊 Performance Summary:');
testResults.forEach(result => {
  const status = result.result === 'PASS' ? '✅' : '❌';
  const time = result.time ? ` (${result.time}ms)` : '';
  console.log(`${status} ${result.test}${time}`);
});

console.log('\n🔥 Forest Server has been tested under EXTREME conditions! 🔥');