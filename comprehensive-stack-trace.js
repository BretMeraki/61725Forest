#!/usr/bin/env node
// @ts-check

/**
 * Comprehensive Stack Trace Analysis Tool for Forest MCP Server
 * Analyzes the entire server end-to-end with detailed execution flow tracking
 */

import { CleanForestServer } from "./server-modular.js";
import * as fs from "fs/promises";
import * as path from "path";

class StackTraceAnalyzer {
  constructor() {
    this.executionLog = [];
    this.moduleLoadingOrder = [];
    this.errorLog = [];
    this.performanceMetrics = {};
    this.dependencyGraph = new Map();
    this.callStack = [];
    this.originalConsoleError = console.error;
    this.setupStackTracing();
  }

  setupStackTracing() {
    // Override console.error to capture all error messages
    console.error = (...args) => {
      const timestamp = new Date().toISOString();
      const stackTrace = new Error().stack;
      this.executionLog.push({
        timestamp,
        type: 'console.error',
        message: args.join(' '),
        stackTrace: stackTrace?.split('\n').slice(1) || []
      });
      this.originalConsoleError(...args);
    };

    // Add global error handlers
    process.on('uncaughtException', (error) => {
      this.errorLog.push({
        timestamp: new Date().toISOString(),
        type: 'uncaughtException',
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.errorLog.push({
        timestamp: new Date().toISOString(),
        type: 'unhandledRejection',
        reason: reason,
        promise: promise
      });
    });
  }

  logExecution(context, operation, details = {}) {
    const timestamp = new Date().toISOString();
    const stackTrace = new Error().stack;
    
    this.executionLog.push({
      timestamp,
      context,
      operation,
      details,
      stackTrace: stackTrace?.split('\n').slice(2, 8) || [], // Top 6 stack frames
      memoryUsage: process.memoryUsage(),
      pid: process.pid
    });
  }

  async analyzeModuleDependencies() {
    this.logExecution('StackTraceAnalyzer', 'analyzeModuleDependencies', { phase: 'start' });
    
    const modulesDir = '/Users/bretmeraki/Desktop/claude-mcp-configs/forest-server/modules';
    const moduleFiles = await fs.readdir(modulesDir);
    
    for (const file of moduleFiles) {
      if (file.endsWith('.js')) {
        const filePath = path.join(modulesDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Extract import statements
        const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
        const dependencies = importMatches.map(match => {
          const depMatch = match.match(/from\s+['"]([^'"]+)['"]/);
          return depMatch ? depMatch[1] : null;
        }).filter(Boolean);
        
        this.dependencyGraph.set(file, {
          path: filePath,
          dependencies,
          size: content.length,
          exports: this.extractExports(content)
        });
        
        this.logExecution('ModuleLoader', 'analyzeModule', {
          module: file,
          dependencies: dependencies.length,
          size: content.length
        });
      }
    }
  }

  extractExports(content) {
    const exportMatches = content.match(/export\s+(?:class|function|const|let|var)\s+(\w+)/g) || [];
    return exportMatches.map(match => {
      const nameMatch = match.match(/export\s+(?:class|function|const|let|var)\s+(\w+)/);
      return nameMatch ? nameMatch[1] : null;
    }).filter(Boolean);
  }

  async instrumentServer() {
    this.logExecution('StackTraceAnalyzer', 'instrumentServer', { phase: 'start' });
    
    const startTime = Date.now();
    let server;
    
    try {
      // Create server instance with instrumentation
      this.logExecution('ServerCreation', 'instantiate', { phase: 'before' });
      server = new CleanForestServer();
      this.logExecution('ServerCreation', 'instantiate', { 
        phase: 'after',
        duration: Date.now() - startTime 
      });

      // Instrument key methods
      this.instrumentMethod(server, 'createProject', 'ProjectManagement');
      this.instrumentMethod(server, 'buildHTATree', 'HTASystem');
      this.instrumentMethod(server, 'generateDailySchedule', 'Scheduling');
      this.instrumentMethod(server, 'getNextTask', 'TaskIntelligence');
      this.instrumentMethod(server, 'completeBlock', 'TaskCompletion');
      this.instrumentMethod(server, 'currentStatus', 'StatusReporting');
      this.instrumentMethod(server, 'askTruthfulClaude', 'ClaudeIntegration');

      return server;
    } catch (error) {
      this.errorLog.push({
        timestamp: new Date().toISOString(),
        type: 'serverInstantiation',
        message: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  instrumentMethod(obj, methodName, context) {
    if (typeof obj[methodName] === 'function') {
      const originalMethod = obj[methodName];
      obj[methodName] = async (...args) => {
        const startTime = Date.now();
        const callId = Math.random().toString(36).substr(2, 9);
        
        this.callStack.push({ method: methodName, context, callId, startTime });
        this.logExecution(context, methodName, { 
          phase: 'start', 
          args: args.length,
          callId,
          stackDepth: this.callStack.length
        });
        
        try {
          const result = await originalMethod.apply(obj, args);
          const duration = Date.now() - startTime;
          
          this.logExecution(context, methodName, { 
            phase: 'success', 
            duration,
            callId,
            resultType: typeof result
          });
          
          this.callStack.pop();
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          this.errorLog.push({
            timestamp: new Date().toISOString(),
            type: 'methodError',
            context,
            method: methodName,
            message: error.message,
            stack: error.stack,
            duration,
            callId
          });
          
          this.callStack.pop();
          throw error;
        }
      };
    }
  }

  async runComprehensiveTrace() {
    this.logExecution('StackTraceAnalyzer', 'runComprehensiveTrace', { phase: 'start' });
    
    try {
      // Phase 1: Analyze module dependencies
      await this.analyzeModuleDependencies();
      
      // Phase 2: Instrument and create server
      const server = await this.instrumentServer();
      
      // Phase 3: Test key operations
      await this.testServerOperations(server);
      
      // Phase 4: Generate comprehensive report
      await this.generateReport();
      
    } catch (error) {
      this.errorLog.push({
        timestamp: new Date().toISOString(),
        type: 'comprehensiveTraceError',
        message: error.message,
        stack: error.stack
      });
      
      await this.generateReport(); // Generate report even if there were errors
      throw error;
    }
  }

  async testServerOperations(server) {
    this.logExecution('StackTraceAnalyzer', 'testServerOperations', { phase: 'start' });
    
    const testOperations = [
      {
        name: 'currentStatus',
        operation: () => server.currentStatus(),
        description: 'Test current status reporting'
      },
      {
        name: 'listProjects', 
        operation: () => server.listProjects(),
        description: 'Test project listing'
      },
      {
        name: 'askTruthfulClaude',
        operation: () => server.askTruthfulClaude('What is 2+2?'),
        description: 'Test Claude integration'
      }
    ];
    
    for (const test of testOperations) {
      const startTime = Date.now();
      try {
        this.logExecution('OperationTest', test.name, { phase: 'start', description: test.description });
        const result = await test.operation();
        const duration = Date.now() - startTime;
        
        this.logExecution('OperationTest', test.name, { 
          phase: 'success', 
          duration,
          resultSize: JSON.stringify(result).length
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        this.errorLog.push({
          timestamp: new Date().toISOString(),
          type: 'operationTest',
          operation: test.name,
          message: error.message,
          stack: error.stack,
          duration
        });
      }
    }
  }

  generateDependencyReport() {
    const report = {
      totalModules: this.dependencyGraph.size,
      modules: [],
      dependencyChains: [],
      circularDependencies: []
    };
    
    for (const [moduleName, moduleInfo] of this.dependencyGraph) {
      report.modules.push({
        name: moduleName,
        dependencies: moduleInfo.dependencies,
        exports: moduleInfo.exports,
        size: moduleInfo.size,
        complexity: moduleInfo.dependencies.length + moduleInfo.exports.length
      });
    }
    
    // Sort by complexity
    report.modules.sort((a, b) => b.complexity - a.complexity);
    
    return report;
  }

  generateExecutionReport() {
    const report = {
      totalExecutions: this.executionLog.length,
      executionsByContext: {},
      timeline: [],
      performanceMetrics: {}
    };
    
    // Group by context
    for (const entry of this.executionLog) {
      if (!report.executionsByContext[entry.context]) {
        report.executionsByContext[entry.context] = [];
      }
      report.executionsByContext[entry.context].push(entry);
    }
    
    // Calculate performance metrics
    for (const [context, entries] of Object.entries(report.executionsByContext)) {
      const durations = entries
        .filter(e => e.details && e.details.duration)
        .map(e => e.details.duration);
      
      if (durations.length > 0) {
        report.performanceMetrics[context] = {
          count: entries.length,
          avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          maxDuration: Math.max(...durations),
          minDuration: Math.min(...durations)
        };
      }
    }
    
    return report;
  }

  generateErrorReport() {
    return {
      totalErrors: this.errorLog.length,
      errorsByType: this.errorLog.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {}),
      criticalErrors: this.errorLog.filter(e => 
        e.type === 'uncaughtException' || e.type === 'serverInstantiation'
      ),
      allErrors: this.errorLog
    };
  }

  async generateReport() {
    this.logExecution('StackTraceAnalyzer', 'generateReport', { phase: 'start' });
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        analysisComplete: true,
        totalModules: this.dependencyGraph.size,
        totalExecutions: this.executionLog.length,
        totalErrors: this.errorLog.length,
        callStackDepth: this.callStack.length
      },
      dependencies: this.generateDependencyReport(),
      execution: this.generateExecutionReport(),
      errors: this.generateErrorReport(),
      callStack: this.callStack,
      memoryUsage: process.memoryUsage()
    };
    
    // Write detailed report
    const reportPath = '/Users/bretmeraki/Desktop/claude-mcp-configs/forest-server/stack-trace-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Write human-readable summary
    const summaryPath = '/Users/bretmeraki/Desktop/claude-mcp-configs/forest-server/stack-trace-summary.md';
    const summary = this.generateHumanReadableSummary(report);
    await fs.writeFile(summaryPath, summary);
    
    console.log(`\n🔍 COMPREHENSIVE STACK TRACE ANALYSIS COMPLETE`);
    console.log(`📄 Detailed Report: ${reportPath}`);
    console.log(`📋 Human Summary: ${summaryPath}`);
    console.log(`\n📊 QUICK SUMMARY:`);
    console.log(`   • Modules Analyzed: ${report.summary.totalModules}`);
    console.log(`   • Execution Events: ${report.summary.totalExecutions}`);
    console.log(`   • Errors Detected: ${report.summary.totalErrors}`);
    console.log(`   • Memory Usage: ${Math.round(report.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    
    return report;
  }

  generateHumanReadableSummary(report) {
    const { dependencies, execution, errors } = report;
    
    return `# Forest MCP Server - Comprehensive Stack Trace Analysis

## 📊 Executive Summary
- **Analysis Date**: ${report.timestamp}
- **Total Modules**: ${dependencies.totalModules}
- **Execution Events**: ${execution.totalExecutions}
- **Errors Detected**: ${errors.totalErrors}
- **Memory Usage**: ${Math.round(report.memoryUsage.heapUsed / 1024 / 1024)}MB

## 🏗️ Architecture Analysis

### Module Complexity (Top 5)
${dependencies.modules.slice(0, 5).map(m => 
  `- **${m.name}**: ${m.complexity} complexity (${m.dependencies.length} deps, ${m.exports.length} exports)`
).join('\n')}

### Dependency Graph
${dependencies.modules.map(m => 
  `- ${m.name} → [${m.dependencies.join(', ')}]`
).join('\n')}

## ⚡ Performance Analysis

### Execution by Context
${Object.entries(execution.executionsByContext).map(([context, entries]) => 
  `- **${context}**: ${entries.length} operations`
).join('\n')}

### Performance Metrics
${Object.entries(execution.performanceMetrics).map(([context, metrics]) => 
  `- **${context}**: avg ${Math.round(metrics.avgDuration)}ms, max ${Math.round(metrics.maxDuration)}ms`
).join('\n')}

## 🚨 Error Analysis

### Error Distribution
${Object.entries(errors.errorsByType).map(([type, count]) => 
  `- **${type}**: ${count} occurrences`
).join('\n')}

### Critical Issues
${errors.criticalErrors.length > 0 ? 
  errors.criticalErrors.map(e => `- **${e.type}**: ${e.message}`).join('\n') :
  'No critical errors detected ✅'
}

## 🔍 Call Stack Analysis
- **Current Stack Depth**: ${report.callStack.length}
- **Active Calls**: ${report.callStack.map(c => c.method).join(' → ')}

## 💾 System Resources
- **Heap Used**: ${Math.round(report.memoryUsage.heapUsed / 1024 / 1024)}MB
- **Heap Total**: ${Math.round(report.memoryUsage.heapTotal / 1024 / 1024)}MB
- **External**: ${Math.round(report.memoryUsage.external / 1024 / 1024)}MB
- **RSS**: ${Math.round(report.memoryUsage.rss / 1024 / 1024)}MB

## 📈 Recommendations

${errors.totalErrors === 0 ? 
  '✅ **Server Health**: Excellent - No critical issues detected' :
  '⚠️ **Action Required**: Review error log for critical issues'
}

${dependencies.totalModules > 10 ? 
  '🔧 **Architecture**: Consider module consolidation for ${dependencies.totalModules} modules' :
  '✅ **Architecture**: Well-structured modular design'
}

${execution.totalExecutions > 100 ? 
  '⚡ **Performance**: High activity detected - monitor resource usage' :
  '✅ **Performance**: Normal execution levels'
}
`;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Comprehensive Stack Trace Analysis...\n');
  
  const analyzer = new StackTraceAnalyzer();
  
  try {
    await analyzer.runComprehensiveTrace();
    console.log('\n✅ Analysis completed successfully!');
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { StackTraceAnalyzer };