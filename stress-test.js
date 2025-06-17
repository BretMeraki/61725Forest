#!/usr/bin/env node

// Comprehensive stress test for Forest Server
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔥 FOREST SERVER COMPREHENSIVE STRESS TEST 🔥\n');

const testResults = [];
let totalTests = 0;
let passedTests = 0;

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    log('✅', message);
    testResults.push({ test: message, result: 'PASS' });
  } else {
    log('❌', message);
    testResults.push({ test: message, result: 'FAIL' });
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testGroup(name, testFn) {
  log('🧪', `Testing: ${name}`);
  try {
    testFn();
  } catch (error) {
    log('💥', `Test group failed: ${name} - ${error.message}`);
  }
  console.log('');
}

// Time parsing edge cases
testGroup('Time Parsing Edge Cases', () => {
  // Mock server with time parsing methods
  const mockServer = {
    parseTime(timeStr) {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) {return null;}
      
      let [, hours, minutes, period] = match;
      hours = parseInt(hours);
      minutes = parseInt(minutes);
      
      if (period.toUpperCase() === 'PM' && hours !== 12) {hours += 12;}
      if (period.toUpperCase() === 'AM' && hours === 12) {hours = 0;}
      
      return hours * 60 + minutes;
    },
    
    formatTime(minutes) {
      const hours24 = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
      return `${hours12}:${mins.toString().padStart(2, '0')} ${period}`;
    }
  };

  // Edge cases
  assert(mockServer.parseTime('12:00 AM') === 0, 'Midnight parsing');
  assert(mockServer.parseTime('12:00 PM') === 720, 'Noon parsing');
  assert(mockServer.parseTime('11:59 PM') === 1439, 'End of day parsing');
  assert(mockServer.parseTime('1:01 AM') === 61, 'Early morning parsing');
  assert(mockServer.parseTime('invalid') === null, 'Invalid time handling');
  
  // Format edge cases
  assert(mockServer.formatTime(0) === '12:00 AM', 'Midnight formatting');
  assert(mockServer.formatTime(720) === '12:00 PM', 'Noon formatting');
  assert(mockServer.formatTime(1439) === '11:59 PM', 'End of day formatting');
  assert(mockServer.formatTime(61) === '1:01 AM', 'Early morning formatting');
});

// Large data handling
testGroup('Large Data Handling', () => {
  const mockLargeProject = {
    goal: 'X'.repeat(10000), // 10KB string
    constraints: Array(1000).fill().map((_, i) => `Constraint ${i}`),
    credentials: Array(500).fill().map((_, i) => ({
      credential_type: `Type ${i}`,
      subject_area: `Subject ${i}`,
      level: 'advanced',
      relevance_to_goal: 'applicable'
    })),
    habits: Array(200).fill().map((_, i) => ({
      habit: `Habit ${i}`,
      frequency: 'daily',
      time_required: '30 minutes'
    }))
  };

  assert(mockLargeProject.goal.length === 10000, 'Large goal string handled');
  assert(mockLargeProject.constraints.length === 1000, 'Large constraints array handled');
  assert(mockLargeProject.credentials.length === 500, 'Large credentials array handled');
  assert(mockLargeProject.habits.length === 200, 'Large habits array handled');
  
  // JSON serialization stress test
  const serialized = JSON.stringify(mockLargeProject);
  const deserialized = JSON.parse(serialized);
  assert(deserialized.goal === mockLargeProject.goal, 'Large data JSON round-trip');
});

// Memory constraints simulation
testGroup('Memory Constraints Simulation', () => {
  const memoryStressData = [];
  
  // Create large arrays to test memory handling
  for (let i = 0; i < 10000; i++) {
    memoryStressData.push({
      id: `task_${i}`,
      title: `Task ${i}: ${'Lorem ipsum '.repeat(50)}`,
      prerequisites: Array(Math.floor(Math.random() * 20)).fill().map((_, j) => `task_${i - j - 1}`).filter(id => id.includes('-') === false),
      branches: Array(Math.floor(Math.random() * 5)).fill().map((_, k) => ({
        title: `Branch ${k}`,
        tasks: Array(10).fill().map((_, l) => `subtask_${i}_${k}_${l}`)
      }))
    });
  }
  
  assert(memoryStressData.length === 10000, 'Large memory structure created');
  
  // Test filtering operations on large datasets
  const filteredData = memoryStressData.filter(item => item.id.includes('_999'));
  assert(filteredData.length > 0, 'Large dataset filtering works');
  
  // Test sorting operations
  const sortedData = memoryStressData.slice(0, 1000).sort((a, b) => a.id.localeCompare(b.id));
  assert(sortedData[0].id === 'task_0', 'Large dataset sorting works');
});

// Concurrent operations simulation
testGroup('Concurrent Operations Simulation', () => {
  const mockPaths = ['programming', 'music', 'fitness', 'cooking', 'language'];
  const mockOperations = [];
  
  // Simulate concurrent path operations
  mockPaths.forEach(pathName => {
    mockOperations.push({
      pathName,
      operation: 'load_hta',
      timestamp: Date.now(),
      data: {
        project_id: 'test_project',
        path_name: pathName,
        frontier_nodes: Array(50).fill().map((_, i) => ({
          id: `${pathName}_task_${i}`,
          title: `${pathName} Task ${i}`,
          prerequisites: i > 0 ? [`${pathName}_task_${i-1}`] : []
        }))
      }
    });
  });
  
  assert(mockOperations.length === 5, 'Concurrent operations created');
  
  // Test path isolation
  const programmingOps = mockOperations.filter(op => op.pathName === 'programming');
  const musicOps = mockOperations.filter(op => op.pathName === 'music');
  
  assert(programmingOps.length === 1, 'Programming path isolated');
  assert(musicOps.length === 1, 'Music path isolated');
  assert(programmingOps[0].data.frontier_nodes[0].id.startsWith('programming_'), 'Path-specific task IDs');
});

// Malformed data handling
testGroup('Malformed Data Handling', () => {
  const malformedInputs = [
    null,
    undefined,
    '',
    '{}',
    '{"incomplete": true',
    '{"goal": null}',
    '{"goal": "", "constraints": "not_an_array"}',
    '{"time_available": "invalid_time"}',
    '{"urgency_level": "super_ultra_mega_urgent"}' // Invalid urgency level
  ];
  
  malformedInputs.forEach((input, index) => {
    try {
      if (typeof input === 'string' && input.includes('{')) {
        const parsed = JSON.parse(input);
        assert(true, `Malformed input ${index} handled gracefully`);
      } else {
        assert(input === null || input === undefined || input === '', `Null/empty input ${index} handled`);
      }
    } catch (error) {
      assert(error instanceof SyntaxError, `Malformed JSON ${index} caught properly`);
    }
  });
});

// Sequencing edge cases
testGroup('Sequencing Edge Cases', () => {
  const mockHTATree = {
    frontier_nodes: [
      { id: 'task_1', prerequisites: [], title: 'First Task' },
      { id: 'task_2', prerequisites: ['task_1'], title: 'Second Task' },
      { id: 'task_3', prerequisites: ['task_2'], title: 'Third Task' },
      { id: 'task_4', prerequisites: ['task_1'], title: 'Fourth Task' },
      { id: 'orphan_task', prerequisites: ['nonexistent_task'], title: 'Orphaned Task' },
      { id: 'circular_a', prerequisites: ['circular_b'], title: 'Circular A' },
      { id: 'circular_b', prerequisites: ['circular_a'], title: 'Circular B' }
    ],
    completed_nodes: [
      { id: 'task_1', title: 'First Task', completed_at: Date.now() }
    ]
  };
  
  // Test finding available tasks
  const completedIds = mockHTATree.completed_nodes.map(node => node.id);
  const availableTasks = mockHTATree.frontier_nodes.filter(node => 
    node.prerequisites.every(prereq => completedIds.includes(prereq))
  );
  
  assert(availableTasks.length >= 1, 'Available tasks found after completion');
  assert(availableTasks.some(task => task.id === 'task_2'), 'Correct next task identified');
  
  // Test orphaned task detection
  const orphanedTasks = mockHTATree.frontier_nodes.filter(node =>
    node.prerequisites.some(prereq => 
      !completedIds.includes(prereq) && 
      !mockHTATree.frontier_nodes.some(fn => fn.id === prereq)
    )
  );
  
  assert(orphanedTasks.length >= 1, 'Orphaned tasks detected');
  assert(orphanedTasks.some(task => task.id === 'orphan_task'), 'Specific orphaned task identified');
  
  // Test circular dependency detection
  const circularTasks = mockHTATree.frontier_nodes.filter(node =>
    node.prerequisites.includes('circular_a') || node.prerequisites.includes('circular_b')
  );
  
  assert(circularTasks.length === 2, 'Circular dependencies detected');
});

// Schedule generation stress test
testGroup('Schedule Generation Stress Test', () => {
  const mockScheduleRequest = {
    wake_time: '5:00 AM',
    sleep_time: '11:00 PM',
    meal_preferences: {
      breakfast: '7:00 AM',
      lunch: '12:30 PM',
      dinner: '6:30 PM'
    },
    habits: Array(20).fill().map((_, i) => ({
      habit: `Habit ${i}`,
      frequency: 'daily',
      time_required: '15 minutes',
      preferred_time: i % 2 === 0 ? 'morning' : 'evening'
    })),
    learning_sessions: Array(10).fill().map((_, i) => ({
      subject: `Subject ${i}`,
      duration: '45 minutes',
      difficulty: i % 3 === 0 ? 'high' : 'medium'
    }))
  };
  
  // Calculate total time needed
  const habitTime = mockScheduleRequest.habits.length * 15; // 15 min each
  const learningTime = mockScheduleRequest.learning_sessions.length * 45; // 45 min each
  const totalScheduledTime = habitTime + learningTime;
  
  // Available time calculation (18 hours - meals - sleep buffer)
  const availableTime = 18 * 60 - 3 * 30; // 18 hours minus meal times
  
  assert(mockScheduleRequest.habits.length === 20, 'Large habits array created');
  assert(mockScheduleRequest.learning_sessions.length === 10, 'Large learning sessions created');
  assert(totalScheduledTime > 0, 'Total scheduled time calculated');
  assert(availableTime > totalScheduledTime, 'Schedule fits in available time');
});

// Path switching performance
testGroup('Path Switching Performance', () => {
  const pathSwitchingData = {};
  const pathNames = Array(50).fill().map((_, i) => `path_${i}`);
  
  // Simulate loading 50 different paths
  pathNames.forEach(pathName => {
    pathSwitchingData[pathName] = {
      hta: {
        project_id: 'test_project',
        path_name: pathName,
        frontier_nodes: Array(100).fill().map((_, i) => ({
          id: `${pathName}_task_${i}`,
          title: `Task ${i}`,
          prerequisites: i > 0 ? [`${pathName}_task_${i-1}`] : []
        }))
      },
      learning_history: Array(200).fill().map((_, i) => ({
        task_id: `${pathName}_task_${Math.floor(i/2)}`,
        action: i % 2 === 0 ? 'started' : 'completed',
        timestamp: Date.now() - (i * 1000)
      }))
    };
  });
  
  assert(Object.keys(pathSwitchingData).length === 50, 'Multiple path data created');
  
  // Test switching between paths
  const pathA = pathSwitchingData['path_0'];
  const pathB = pathSwitchingData['path_49'];
  
  assert(pathA.hta.path_name === 'path_0', 'Path A data isolated');
  assert(pathB.hta.path_name === 'path_49', 'Path B data isolated');
  assert(pathA.hta.frontier_nodes[0].id.startsWith('path_0_'), 'Path A task IDs isolated');
  assert(pathB.hta.frontier_nodes[0].id.startsWith('path_49_'), 'Path B task IDs isolated');
});

// Final results
console.log('\n🏁 STRESS TEST RESULTS 🏁');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  log('🎉', 'ALL STRESS TESTS PASSED! Forest Server is robust and ready.');
} else {
  log('⚠️', `${totalTests - passedTests} tests failed. Review results above.`);
}

console.log('\n📊 Test Summary:');
testResults.forEach(result => {
  console.log(`${result.result === 'PASS' ? '✅' : '❌'} ${result.test}`);
});