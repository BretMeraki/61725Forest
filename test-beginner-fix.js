#!/usr/bin/env node

// Test script to verify the "Advanced Task Default Syndrome" fix
import { HtaTreeBuilder } from './modules/hta-tree-builder.js';
import { DataPersistence } from './modules/data-persistence.js';

// Mock LLM interface that simulates the broken interface
const mockLLM = {
  async requestIntelligence(type, options) {
    console.log('🤖 Mock LLM called (simulating broken interface)');
    
    // Simulate the broken interface that was causing 0 frontier nodes
    return {
      request_for_claude: { type, payload: options }
    };
  }
};

// Mock data persistence
const mockDataPersistence = {
  async logError() { /* no-op */ }
};

// Mock project management
const mockProjectManagement = {};

async function testBeginnerScenario() {
  console.log('🧪 Testing Beginner Guitar Scenario');
  console.log('===================================');
  
  const htaBuilder = new HtaTreeBuilder(mockDataPersistence, mockProjectManagement, mockLLM);
  
  // Simulate complete beginner config
  const beginnerConfig = {
    goal: 'Learn Guitar',
    knowledge_level: 1,  // Complete beginner
    context: 'I have never played any musical instrument before. Complete beginner.',
    specific_interests: ['acoustic guitar', 'basic chords']
  };
  
  try {
    console.log('\n📝 Testing generateHTAFramework...');
    const result = await htaBuilder.generateHTAFramework(
      beginnerConfig,
      'general',
      'mixed',
      [],
      null
    );
    
    console.log('\n✅ HTA Framework Generated!');
    console.log(`Strategic Branches: ${result.strategicBranches?.length || 0}`);
    console.log(`Frontier Nodes: ${result.frontierNodes?.length || 0}`);
    
    if (result.frontierNodes && result.frontierNodes.length > 0) {
      console.log('\n🎯 Sample Generated Tasks:');
      result.frontierNodes.slice(0, 3).forEach((task, i) => {
        console.log(`${i + 1}. "${task.title}"`);
        console.log(`   Difficulty: ${task.difficulty}/5`);
        console.log(`   Duration: ${task.duration}`);
        console.log(`   Description: ${task.description}`);
        console.log();
      });
      
      // Verify the fix
      const allTasksAppropriate = result.frontierNodes.every(task => {
        const difficulty = task.difficulty || 1;
        const duration = parseInt(task.duration) || 30;
        return difficulty <= 2 && duration <= 30;
      });
      
      if (allTasksAppropriate) {
        console.log('✅ SUCCESS: All tasks are beginner-appropriate!');
        console.log('   - All difficulties ≤ 2/5');
        console.log('   - All durations ≤ 30 minutes');
      } else {
        console.log('❌ FAILED: Some tasks are still too advanced');
        result.frontierNodes.forEach(task => {
          const difficulty = task.difficulty || 1;
          const duration = parseInt(task.duration) || 30;
          if (difficulty > 2 || duration > 30) {
            console.log(`   Problem: "${task.title}" - Difficulty: ${difficulty}, Duration: ${duration}min`);
          }
        });
      }
    } else {
      console.log('❌ No frontier nodes generated');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBeginnerScenario().then(() => {
  console.log('\n🏁 Test completed');
}).catch(console.error);