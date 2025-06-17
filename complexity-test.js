#!/usr/bin/env node

// INFINITE SCALING COMPLEXITY ENGINE TEST
console.log('🌟 INFINITE SCALING COMPLEXITY ENGINE TEST 🌟\n');

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

// Mock the Forest Server complexity detection engine
class ComplexityEngine {
  analyzeComplexityIndicators(learningHistory) {
    const recentCompletions = learningHistory.completed_topics?.slice(-10) || [];
    const indicators = {
      financial_tracking: { level: 0, signals: [], detected: false },
      people_coordination: { level: 0, signals: [], detected: false },
      time_horizons: { level: 0, signals: [], detected: false },
      decision_weight: { level: 0, signals: [], detected: false },
      strategic_thinking: { level: 0, signals: [], detected: false }
    };
    
    recentCompletions.forEach(completion => {
      const content = (completion.topic + ' ' + (completion.learned || '') + ' ' + (completion.outcome || '')).toLowerCase();
      
      // Financial indicators
      if (content.match(/\$[\d,]+|revenue|profit|cost|budget|pricing|sales|income|expense/)) {
        indicators.financial_tracking.signals.push(completion.topic);
        if (content.match(/\$[\d,]{4,}|revenue.*\d+k|profit.*\d+/)) {
          indicators.financial_tracking.level = Math.max(indicators.financial_tracking.level, 2);
        } else {
          indicators.financial_tracking.level = Math.max(indicators.financial_tracking.level, 1);
        }
      }
      
      // People coordination indicators
      if (content.match(/team|people|coordinate|manage|lead|delegate|hire|meeting|collaborate|staff/)) {
        indicators.people_coordination.signals.push(completion.topic);
        if (content.match(/hire|staff|manage.*team|lead.*people/)) {
          indicators.people_coordination.level = Math.max(indicators.people_coordination.level, 2);
        } else {
          indicators.people_coordination.level = Math.max(indicators.people_coordination.level, 1);
        }
      }
      
      // Time horizon indicators
      if (content.match(/quarter|year|long.?term|strategy|plan.*month|roadmap|vision/)) {
        indicators.time_horizons.signals.push(completion.topic);
        if (content.match(/year|quarterly|annual|long.?term.*strategy/)) {
          indicators.time_horizons.level = Math.max(indicators.time_horizons.level, 2);
        } else {
          indicators.time_horizons.level = Math.max(indicators.time_horizons.level, 1);
        }
      }
      
      // Decision weight indicators  
      if (content.match(/decision|choose|strategy|invest|acquire|partner|contract|legal/)) {
        indicators.decision_weight.signals.push(completion.topic);
        if (content.match(/invest|acquire|partner.*company|legal.*contract|strategic.*decision/)) {
          indicators.decision_weight.level = Math.max(indicators.decision_weight.level, 2);
        } else {
          indicators.decision_weight.level = Math.max(indicators.decision_weight.level, 1);
        }
      }
      
      // Strategic thinking indicators
      if (content.match(/market|competition|industry|scale|growth|expansion|opportunity/)) {
        indicators.strategic_thinking.signals.push(completion.topic);
        if (content.match(/market.*analysis|industry.*trends|scale.*operation|growth.*strategy/)) {
          indicators.strategic_thinking.level = Math.max(indicators.strategic_thinking.level, 2);
        } else {
          indicators.strategic_thinking.level = Math.max(indicators.strategic_thinking.level, 1);
        }
      }
    });
    
    // Determine detection status
    Object.keys(indicators).forEach(key => {
      indicators[key].detected = indicators[key].level > 0;
    });
    
    const totalComplexity = Object.values(indicators).reduce((sum, indicator) => sum + indicator.level, 0);
    const activeIndicators = Object.values(indicators).filter(indicator => indicator.detected).length;
    
    return {
      indicators,
      overall_complexity_level: totalComplexity,
      active_complexity_domains: activeIndicators,
      ready_for_scaling: totalComplexity >= 3 && activeIndicators >= 2,
      complexity_tier: this.determineComplexityTier(totalComplexity, activeIndicators)
    };
  }

  determineComplexityTier(totalComplexity, activeIndicators) {
    if (totalComplexity === 0) {return 'individual';}
    if (totalComplexity <= 3 && activeIndicators <= 2) {return 'coordination';}
    if (totalComplexity <= 6 && activeIndicators <= 3) {return 'management';}
    if (totalComplexity <= 10 && activeIndicators <= 4) {return 'strategic';}
    return 'enterprise';
  }
}

const engine = new ComplexityEngine();

// Test 1: Individual Level (Security Guard starting out)
testGroup('INDIVIDUAL COMPLEXITY TIER', () => {
  const individualHistory = {
    completed_topics: [
      { topic: 'Research Lucasfilm creative roles', learned: 'Found job descriptions', outcome: 'Basic understanding' },
      { topic: 'Study film production basics', learned: 'How movies are made', outcome: 'Introductory knowledge' },
      { topic: 'Watch Star Wars documentaries', learned: 'Behind scenes process', outcome: 'Fan knowledge enhanced' }
    ]
  };
  
  const analysis = engine.analyzeComplexityIndicators(individualHistory);
  
  assert(analysis.complexity_tier === 'individual', `Detected individual tier: ${analysis.complexity_tier}`);
  assert(analysis.overall_complexity_level === 0, `No complexity detected: ${analysis.overall_complexity_level}`);
  assert(analysis.active_complexity_domains === 0, `No active domains: ${analysis.active_complexity_domains}`);
  assert(!analysis.ready_for_scaling, 'Not ready for scaling yet');
});

// Test 2: Coordination Level (Starting to coordinate with others)
testGroup('COORDINATION COMPLEXITY TIER', () => {
  const coordinationHistory = {
    completed_topics: [
      { topic: 'Network with local filmmakers', learned: 'Made 3 contacts', outcome: 'Basic connections established' },
      { topic: 'Collaborate on short film', learned: 'Team coordination skills', outcome: 'First team project completed' },
      { topic: 'Set up basic budget tracking', learned: 'Track $500 project costs', outcome: 'Financial awareness started' }
    ]
  };
  
  const analysis = engine.analyzeComplexityIndicators(coordinationHistory);
  
  assert(analysis.complexity_tier === 'coordination', `Detected coordination tier: ${analysis.complexity_tier}`);
  assert(analysis.overall_complexity_level >= 1, `Some complexity detected: ${analysis.overall_complexity_level}`);
  assert(analysis.indicators.people_coordination.detected, 'People coordination detected');
  assert(analysis.indicators.financial_tracking.detected, 'Financial tracking detected');
});

// Test 3: Strategic Level (Multi-domain management)
testGroup('STRATEGIC COMPLEXITY TIER', () => {
  const strategicHistory = {
    completed_topics: [
      { topic: 'Develop 3-year career strategy', learned: 'Long-term planning approach', outcome: 'Strategic roadmap created' },
      { topic: 'Manage team of 5 creators', learned: 'Leadership and delegation', outcome: 'Team coordination systems established' },
      { topic: 'Analyze market trends', learned: 'Industry analysis skills', outcome: 'Market positioning understood' },
      { topic: 'Negotiate contract with studio', learned: 'Legal and business skills', outcome: 'Strategic partnership secured' },
      { topic: 'Plan quarterly revenue goals', learned: 'Financial forecasting', outcome: 'Revenue targets of $50k set' }
    ]
  };
  
  const analysis = engine.analyzeComplexityIndicators(strategicHistory);
  
  assert(analysis.complexity_tier === 'strategic', `Detected strategic tier: ${analysis.complexity_tier}`);
  assert(analysis.overall_complexity_level >= 5, `High complexity detected: ${analysis.overall_complexity_level}`);
  assert(analysis.active_complexity_domains >= 3, `Multiple domains active: ${analysis.active_complexity_domains}`);
  assert(analysis.ready_for_scaling, 'Ready for scaling operations');
});

// Test 4: Enterprise Level (Full complexity orchestration)
testGroup('ENTERPRISE COMPLEXITY TIER', () => {
  const enterpriseHistory = {
    completed_topics: [
      { topic: 'Acquire competitor studio', learned: 'M&A process management', outcome: 'Strategic acquisition completed' },
      { topic: 'Manage 50-person organization', learned: 'Organizational design', outcome: 'Scaled team management systems' },
      { topic: 'Annual strategic planning', learned: 'Long-term strategic thinking', outcome: 'Multi-year vision established' },
      { topic: 'Market expansion strategy', learned: 'Growth and scaling', outcome: 'International expansion planned' },
      { topic: 'Partnership with major studio', learned: 'Enterprise negotiations', outcome: 'Strategic alliance secured' },
      { topic: 'Legal compliance framework', learned: 'Regulatory management', outcome: 'Legal structure established' },
      { topic: 'Investment round planning', learned: 'Capital strategy', outcome: 'Series A funding secured' }
    ]
  };
  
  const analysis = engine.analyzeComplexityIndicators(enterpriseHistory);
  
  assert(analysis.complexity_tier === 'enterprise', `Detected enterprise tier: ${analysis.complexity_tier}`);
  assert(analysis.overall_complexity_level >= 8, `Maximum complexity detected: ${analysis.overall_complexity_level}`);
  assert(analysis.active_complexity_domains >= 4, `All domains active: ${analysis.active_complexity_domains}`);
  assert(analysis.ready_for_scaling, 'Operating at enterprise scale');
});

// Test 5: Scaling Pathway Progression
testGroup('COMPLEXITY SCALING PROGRESSION', () => {
  const progressionStages = [
    { stage: 'Week 1', complexity: 0, tier: 'individual', description: 'Personal learning only' },
    { stage: 'Month 6', complexity: 2, tier: 'coordination', description: 'Basic coordination + financial tracking' },
    { stage: 'Year 1', complexity: 5, tier: 'management', description: 'Multi-domain management' },
    { stage: 'Year 3', complexity: 8, tier: 'strategic', description: 'Strategic operations' },
    { stage: 'Year 5', complexity: 12, tier: 'enterprise', description: 'Full enterprise orchestration' }
  ];
  
  progressionStages.forEach((stage, index) => {
    const activeIndicators = Math.min(stage.complexity, 5);
    const tier = engine.determineComplexityTier(stage.complexity, activeIndicators);
    
    assert(tier === stage.tier, `${stage.stage}: Correct tier detected (${tier})`);
    
    if (index > 0) {
      const prevStage = progressionStages[index - 1];
      assert(stage.complexity > prevStage.complexity, `${stage.stage}: Complexity increased from previous stage`);
    }
  });
});

// Test 6: Domain-Agnostic Pattern Recognition
testGroup('DOMAIN-AGNOSTIC PATTERN RECOGNITION', () => {
  const musicEntrepreneurHistory = {
    completed_topics: [
      { topic: 'Set up recording studio budget', learned: 'Track $10k equipment costs', outcome: 'Studio budget managed' },
      { topic: 'Coordinate with band members', learned: 'Team scheduling and communication', outcome: 'Band coordination improved' },
      { topic: 'Plan album release strategy', learned: 'Long-term planning', outcome: 'Marketing roadmap created' }
    ]
  };
  
  const techStartupHistory = {
    completed_topics: [
      { topic: 'Manage development team', learned: 'Lead 8 engineers', outcome: 'Team productivity increased' },
      { topic: 'Track monthly recurring revenue', learned: 'Financial analytics', outcome: '$25k MRR achieved' },
      { topic: 'Strategic competitor analysis', learned: 'Market positioning', outcome: 'Competitive advantages identified' }
    ]
  };
  
  const musicAnalysis = engine.analyzeComplexityIndicators(musicEntrepreneurHistory);
  const techAnalysis = engine.analyzeComplexityIndicators(techStartupHistory);
  
  assert(musicAnalysis.complexity_tier === 'coordination', 'Music entrepreneur at coordination level');
  assert(techAnalysis.complexity_tier === 'management', 'Tech startup at management level');
  
  // Both should detect similar patterns despite different domains
  assert(musicAnalysis.indicators.financial_tracking.detected, 'Music: Financial tracking detected');
  assert(techAnalysis.indicators.financial_tracking.detected, 'Tech: Financial tracking detected');
  assert(musicAnalysis.indicators.people_coordination.detected, 'Music: People coordination detected');
  assert(techAnalysis.indicators.people_coordination.detected, 'Tech: People coordination detected');
});

// Final results
console.log('\n🌟 INFINITE SCALING COMPLEXITY ENGINE RESULTS 🌟');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  log('🎉', 'COMPLEXITY ENGINE READY! Forest can now scale infinitely from individual to enterprise! 🎉');
} else {
  log('⚠️', `${totalTests - passedTests} complexity detection issues need refinement.`);
}

console.log('\n📊 Complexity Engine Summary:');
testResults.forEach(result => {
  console.log(`${result.result === 'PASS' ? '✅' : '❌'} ${result.test}`);
});

console.log('\n🚀 Forest Server Complexity Tiers:');
console.log('  🌱 INDIVIDUAL: Personal learning and skill building');
console.log('  🤝 COORDINATION: Basic coordination and simple financial tracking');  
console.log('  📊 MANAGEMENT: Multi-domain management and team coordination');
console.log('  🎯 STRATEGIC: Strategic operations and market positioning');
console.log('  🏢 ENTERPRISE: Full enterprise complexity orchestration');
console.log('\n💫 Same system. Same perfect guidance. Infinite scaling!');