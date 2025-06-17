#!/usr/bin/env node
// @ts-check

/**
 * Targeted Fix Analysis - Specific Issues with Exact Locations and Solutions
 */

import * as fs from "fs/promises";
import * as path from "path";

class TargetedFixAnalyzer {
  constructor() {
    this.criticalFixes = [];
    this.performanceFixes = [];
    this.securityFixes = [];
    this.maintainabilityFixes = [];
  }

  async analyzeSpecificIssues() {
    console.log('🎯 TARGETED FIX ANALYSIS: Finding exact issues and solutions...\n');
    
    const rootDir = '/Users/bretmeraki/Desktop/claude-mcp-configs/forest-server';
    
    // Analyze core production files only (skip tests for now)
    const productionFiles = [
      'server-modular.js',
      'modules/core-infrastructure.js',
      'modules/data-persistence.js',
      'modules/mcp-handlers.js',
      'modules/tool-router.js',
      'modules/project-management.js',
      'modules/task-intelligence.js',
      'modules/llm-integration.js'
    ];
    
    for (const file of productionFiles) {
      const filePath = path.join(rootDir, file);
      await this.analyzeProductionFile(filePath);
    }
    
    this.generateTargetedFixPlan();
  }

  async analyzeProductionFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);
      const lines = content.split('\n');
      
      console.log(`🔍 Analyzing ${fileName} for specific issues...`);
      
      // Critical Issues Analysis
      this.findCriticalErrorHandling(content, fileName, lines);
      this.findSilentFailures(content, fileName, lines);
      this.findSecurityIssues(content, fileName, lines);
      
      // Performance Issues
      this.findPerformanceProblems(content, fileName, lines);
      
      // Maintainability Issues
      this.findHardcodedValues(content, fileName, lines);
      this.findComplexityIssues(content, fileName, lines);
      
    } catch (error) {
      console.error(`❌ Cannot analyze ${filePath}: ${error.message}`);
    }
  }

  findCriticalErrorHandling(content, fileName, lines) {
    // Generic error messages
    const genericErrorPattern = /throw new Error\(['"`]([^'"`]*Project configuration not found[^'"`]*|[^'"`]*Missing required fields[^'"`]*|[^'"`]*No active project[^'"`]*)['"`]\)/g;
    let match;
    
    while ((match = genericErrorPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      this.criticalFixes.push({
        file: fileName,
        type: 'GENERIC_ERROR',
        severity: 'HIGH',
        lineNumber,
        issue: 'Generic error message provides no context',
        currentCode: match[0],
        suggestedFix: `Create specific error classes with context`,
        solution: `
// Instead of: throw new Error('Project configuration not found')
// Use:
class ProjectConfigurationError extends Error {
  constructor(projectId, configPath, cause) {
    super(\`Project configuration not found for '\${projectId}' at '\${configPath}'. Cause: \${cause}\`);
    this.name = 'ProjectConfigurationError';
    this.projectId = projectId;
    this.configPath = configPath;
    this.cause = cause;
  }
}
throw new ProjectConfigurationError(projectId, configPath, 'File does not exist');`
      });
    }

    // Empty catch blocks
    const emptyCatchPattern = /catch\s*\(\s*[^)]*\)\s*\{\s*\}/g;
    while ((match = emptyCatchPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      this.criticalFixes.push({
        file: fileName,
        type: 'EMPTY_CATCH',
        severity: 'HIGH',
        lineNumber,
        issue: 'Empty catch block swallows errors',
        currentCode: match[0],
        suggestedFix: 'Add proper error handling or re-throw',
        solution: `
catch (error) {
  console.error('Error in [operation]:', error);
  // Either handle gracefully or re-throw
  throw new OperationError('Failed to [operation]', { cause: error });
}`
      });
    }
  }

  findSilentFailures(content, fileName, lines) {
    // Silent return in catch blocks
    const silentReturnPattern = /catch\s*\(\s*([^)]*)\)\s*\{\s*return/g;
    let match;
    
    while ((match = silentReturnPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      this.criticalFixes.push({
        file: fileName,
        type: 'SILENT_FAILURE',
        severity: 'CRITICAL',
        lineNumber,
        issue: 'Silent failure - errors are hidden from caller',
        currentCode: this.getCodeContext(content, match.index, 3),
        suggestedFix: 'Log error and return error indicator or throw',
        solution: `
catch (error) {
  console.error('Operation failed:', error);
  return { success: false, error: error.message };
  // OR: throw new Error('Operation failed', { cause: error });
}`
      });
    }
  }

  findSecurityIssues(content, fileName, lines) {
    // Look for actual credential exposure (not just the word "key")
    const credentialPatterns = [
      { pattern: /apiKey\s*[:=]\s*['"`]([^'"`]{10,})['"`]/g, type: 'API_KEY' },
      { pattern: /password\s*[:=]\s*['"`]([^'"`]+)['"`]/g, type: 'PASSWORD' },
      { pattern: /secret\s*[:=]\s*['"`]([^'"`]{10,})['"`]/g, type: 'SECRET' },
      { pattern: /token\s*[:=]\s*['"`]([^'"`]{20,})['"`]/g, type: 'TOKEN' }
    ];

    credentialPatterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        this.securityFixes.push({
          file: fileName,
          type: 'CREDENTIAL_EXPOSURE',
          severity: 'CRITICAL',
          lineNumber,
          issue: `${type} hardcoded in source`,
          currentCode: match[0].replace(match[1], '***REDACTED***'),
          suggestedFix: 'Move to environment variables',
          solution: `
// Instead of: apiKey: "hardcoded_key_here"
// Use:
const apiKey = process.env.API_KEY || (() => {
  throw new Error('API_KEY environment variable is required');
})();`
        });
      }
    });
  }

  findPerformanceProblems(content, fileName, lines) {
    // Await in for loops
    const awaitInLoopPattern = /for\s*\([^)]*\)\s*\{[^}]*await[^}]*\}/g;
    let match;
    
    while ((match = awaitInLoopPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      this.performanceFixes.push({
        file: fileName,
        type: 'AWAIT_IN_LOOP',
        severity: 'HIGH',
        lineNumber,
        issue: 'Sequential async operations in loop - poor performance',
        currentCode: this.getCodeContext(content, match.index, 2),
        suggestedFix: 'Use Promise.all() for parallel execution',
        solution: `
// Instead of:
for (const item of items) {
  await processItem(item);
}

// Use:
await Promise.all(items.map(item => processItem(item)));

// Or for controlled concurrency:
const results = [];
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(batch.map(processItem));
  results.push(...batchResults);
}`
      });
    }

    // JSON.parse(JSON.stringify()) pattern
    const deepCopyPattern = /JSON\.parse\(JSON\.stringify\([^)]+\)\)/g;
    while ((match = deepCopyPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      this.performanceFixes.push({
        file: fileName,
        type: 'INEFFICIENT_DEEP_COPY',
        severity: 'MEDIUM',
        lineNumber,
        issue: 'Inefficient deep copy using JSON methods',
        currentCode: match[0],
        suggestedFix: 'Use structuredClone() or a proper deep copy library',
        solution: `
// Instead of: JSON.parse(JSON.stringify(obj))
// Use:
const deepCopy = structuredClone(obj); // Native method (Node 17+)
// Or: import { cloneDeep } from 'lodash';`
      });
    }
  }

  findHardcodedValues(content, fileName, lines) {
    // Hardcoded file paths
    const filePathPattern = /['"`]([^'"`]*\.json)['"`]/g;
    let match;
    const filePaths = new Set();
    
    while ((match = filePathPattern.exec(content)) !== null) {
      if (!filePaths.has(match[1])) {
        filePaths.add(match[1]);
        const lineNumber = content.substring(0, match.index).split('\n').length;
        this.maintainabilityFixes.push({
          file: fileName,
          type: 'HARDCODED_FILENAME',
          severity: 'MEDIUM',
          lineNumber,
          issue: `Hardcoded filename: ${match[1]}`,
          currentCode: match[0],
          suggestedFix: 'Move to configuration constants',
          solution: `
// Create a constants file:
const FILE_NAMES = {
  CONFIG: 'config.json',
  HTA: 'hta.json',
  LEARNING_HISTORY: 'learning_history.json',
  SCHEDULE: (date) => \`day_\${date}.json\`
};

// Use: FILE_NAMES.CONFIG instead of 'config.json'`
        });
      }
    }

    // Console.log in production code (excluding obvious debug/error logging)
    const consoleLogPattern = /console\.(log|warn|info)\(/g;
    while ((match = consoleLogPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1];
      
      // Skip if it's clearly error/debug logging
      if (!line.includes('error') && !line.includes('Error') && !line.includes('debug')) {
        this.maintainabilityFixes.push({
          file: fileName,
          type: 'CONSOLE_LOGGING',
          severity: 'LOW',
          lineNumber,
          issue: 'Console logging in production code',
          currentCode: line.trim(),
          suggestedFix: 'Replace with proper logging framework',
          solution: `
// Create a logger instance:
import { createLogger } from './utils/logger.js';
const logger = createLogger(module.filename);

// Replace console.log with:
logger.info('message');
logger.debug('debug info');
logger.error('error message');`
        });
      }
    }
  }

  findComplexityIssues(content, fileName, lines) {
    // Find very long functions
    const functionPattern = /(?:function\s+\w+|(?:async\s+)?(?:function|\w+)\s*(?:\([^)]*\))?\s*=>?\s*)\s*\{/g;
    let match;
    
    while ((match = functionPattern.exec(content)) !== null) {
      const startIndex = match.index;
      const functionEnd = this.findMatchingBrace(content, startIndex + match[0].length - 1);
      
      if (functionEnd > 0) {
        const functionLength = functionEnd - startIndex;
        const functionCode = content.substring(startIndex, functionEnd + 1);
        const lineCount = functionCode.split('\n').length;
        
        if (functionLength > 2000 || lineCount > 50) {
          const lineNumber = content.substring(0, startIndex).split('\n').length;
          this.maintainabilityFixes.push({
            file: fileName,
            type: 'LONG_FUNCTION',
            severity: 'HIGH',
            lineNumber,
            issue: `Very long function: ${functionLength} chars, ${lineCount} lines`,
            currentCode: 'Function too long to display',
            suggestedFix: 'Break into smaller, focused functions',
            solution: `
// Break large functions into smaller ones:
// 1. Extract helper functions
// 2. Separate concerns (validation, processing, formatting)
// 3. Use composition pattern
// 4. Follow single responsibility principle

// Example refactor:
async function processData(data) {
  const validated = validateData(data);
  const transformed = transformData(validated);
  const result = await saveData(transformed);
  return formatResult(result);
}`
          });
        }
      }
    }
  }

  findMatchingBrace(content, startIndex) {
    let braceCount = 1;
    let index = startIndex + 1;
    
    while (index < content.length && braceCount > 0) {
      if (content[index] === '{') {braceCount++;}
      else if (content[index] === '}') {braceCount--;}
      index++;
    }
    
    return braceCount === 0 ? index - 1 : -1;
  }

  getCodeContext(content, index, contextLines = 2) {
    const lines = content.split('\n');
    const targetLine = content.substring(0, index).split('\n').length - 1;
    const start = Math.max(0, targetLine - contextLines);
    const end = Math.min(lines.length, targetLine + contextLines + 1);
    
    return lines.slice(start, end)
      .map((line, i) => `${start + i + 1}: ${line}`)
      .join('\n');
  }

  generateTargetedFixPlan() {
    console.log('\n🎯 TARGETED FIX PLAN\n');
    
    const allFixes = [
      ...this.criticalFixes,
      ...this.securityFixes,
      ...this.performanceFixes,
      ...this.maintainabilityFixes
    ];
    
    // Sort by severity and frequency
    const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    allFixes.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    
    console.log(`📊 TOTAL FIXES NEEDED: ${allFixes.length}`);
    console.log(`🔴 CRITICAL: ${allFixes.filter(f => f.severity === 'CRITICAL').length}`);
    console.log(`🟠 HIGH: ${allFixes.filter(f => f.severity === 'HIGH').length}`);
    console.log(`🟡 MEDIUM: ${allFixes.filter(f => f.severity === 'MEDIUM').length}`);
    console.log(`🟢 LOW: ${allFixes.filter(f => f.severity === 'LOW').length}\n`);
    
    // Group by priority for execution
    const criticalFixes = allFixes.filter(f => f.severity === 'CRITICAL');
    const highPriorityFixes = allFixes.filter(f => f.severity === 'HIGH');
    
    if (criticalFixes.length > 0) {
      console.log('🚨 CRITICAL FIXES (DO THESE FIRST):');
      criticalFixes.forEach((fix, i) => {
        console.log(`\n${i + 1}. ${fix.file}:${fix.lineNumber} - ${fix.type}`);
        console.log(`   Issue: ${fix.issue}`);
        console.log(`   Fix: ${fix.suggestedFix}`);
        if (fix.currentCode && fix.currentCode.length < 100) {
          console.log(`   Current: ${fix.currentCode}`);
        }
        console.log(`   Solution: ${fix.solution.trim()}`);
      });
    }
    
    console.log('\n🔥 HIGH PRIORITY FIXES:');
    highPriorityFixes.slice(0, 10).forEach((fix, i) => {
      console.log(`\n${i + 1}. ${fix.file}:${fix.lineNumber} - ${fix.type}`);
      console.log(`   Issue: ${fix.issue}`);
      console.log(`   Fix: ${fix.suggestedFix}`);
    });
    
    if (highPriorityFixes.length > 10) {
      console.log(`\n   ... and ${highPriorityFixes.length - 10} more high priority fixes`);
    }
    
    // Generate fix scripts
    this.generateFixScripts(allFixes);
    
    return {
      totalFixes: allFixes.length,
      critical: criticalFixes.length,
      high: highPriorityFixes.length,
      fixes: allFixes
    };
  }

  async generateFixScripts(fixes) {
    // Group fixes by file
    const fixesByFile = fixes.reduce((acc, fix) => {
      if (!acc[fix.file]) {acc[fix.file] = [];}
      acc[fix.file].push(fix);
      return acc;
    }, {});
    
    // Generate automated fix script
    const fixScript = `#!/usr/bin/env node
// AUTOMATED FIX SCRIPT - Generated by Targeted Fix Analysis

// CRITICAL FIXES TO APPLY MANUALLY:
${fixes.filter(f => f.severity === 'CRITICAL').map(fix => `
// ${fix.file}:${fix.lineNumber} - ${fix.type}
// ${fix.issue}
// ${fix.suggestedFix}
`).join('')}

// Files needing attention:
${Object.keys(fixesByFile).map(file => `
// ${file}: ${fixesByFile[file].length} fixes needed
//   - ${fixesByFile[file].map(f => f.type).join(', ')}
`).join('')}
`;
    
    await fs.writeFile(
      '/Users/bretmeraki/Desktop/claude-mcp-configs/forest-server/targeted-fixes.txt',
      fixScript
    );
    
    console.log('\n📝 Fix plan saved to: targeted-fixes.txt');
  }
}

async function main() {
  const analyzer = new TargetedFixAnalyzer();
  await analyzer.analyzeSpecificIssues();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TargetedFixAnalyzer };