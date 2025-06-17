#!/usr/bin/env node
// @ts-check

/**
 * AGGRESSIVE Deep Inspection Tool - Finding the REAL Issues
 * This tool will find problems the surface analysis missed
 */

import * as fs from "fs/promises";
import * as path from "path";

class DeepInspector {
  constructor() {
    this.issues = [];
    this.codeSmells = [];
    this.potentialProblems = [];
    this.antiPatterns = [];
  }

  async analyzeAllFiles() {
    console.log('🔍 DEEP INSPECTION: Looking for REAL issues...\n');
    
    const rootDir = '/Users/bretmeraki/Desktop/claude-mcp-configs/forest-server';
    
    // Analyze main server file
    await this.inspectFile(path.join(rootDir, 'server-modular.js'), 'MAIN_SERVER');
    
    // Analyze all modules
    const modulesDir = path.join(rootDir, 'modules');
    const moduleFiles = await fs.readdir(modulesDir);
    
    for (const file of moduleFiles) {
      if (file.endsWith('.js')) {
        await this.inspectFile(path.join(modulesDir, file), 'MODULE');
      }
    }
    
    // Analyze test files
    const testFiles = (await fs.readdir(rootDir)).filter(f => f.includes('test') && f.endsWith('.js'));
    for (const file of testFiles) {
      await this.inspectFile(path.join(rootDir, file), 'TEST');
    }
  }

  async inspectFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);
      
      console.log(`🔎 Inspecting ${fileName}...`);
      
      // Check for hardcoded values
      this.checkHardcodedValues(content, fileName);
      
      // Check for error handling issues
      this.checkErrorHandling(content, fileName);
      
      // Check for async/await issues
      this.checkAsyncIssues(content, fileName);
      
      // Check for type safety issues
      this.checkTypeSafety(content, fileName);
      
      // Check for code complexity
      this.checkComplexity(content, fileName);
      
      // Check for potential memory leaks
      this.checkMemoryLeaks(content, fileName);
      
      // Check for security issues
      this.checkSecurity(content, fileName);
      
      // Check for performance issues
      this.checkPerformance(content, fileName);
      
    } catch (error) {
      this.issues.push({
        file: path.basename(filePath),
        type: 'FILE_ACCESS_ERROR',
        severity: 'HIGH',
        message: `Cannot read file: ${error.message}`
      });
    }
  }

  checkHardcodedValues(content, fileName) {
    // Look for hardcoded strings, numbers, paths
    const hardcodedPatterns = [
      { pattern: /['"`][^'"`]*\.forest-data[^'"`]*['"`]/g, issue: 'Hardcoded data directory path' },
      { pattern: /port\s*[=:]\s*\d{4,5}/gi, issue: 'Hardcoded port number' },
      { pattern: /localhost|127\.0\.0\.1/g, issue: 'Hardcoded localhost reference' },
      { pattern: /['"`][^'"`]*\.json['"`]/g, issue: 'Hardcoded JSON file names' },
      { pattern: /setTimeout\(\s*[^,]+,\s*\d+\)/g, issue: 'Hardcoded timeout values' },
      { pattern: /console\.(log|error|warn)\(/g, issue: 'Console logging in production code' }
    ];

    hardcodedPatterns.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          file: fileName,
          type: 'HARDCODED_VALUE',
          severity: 'MEDIUM',
          message: `${issue}: Found ${matches.length} instances`,
          examples: matches.slice(0, 3)
        });
      }
    });
  }

  checkErrorHandling(content, fileName) {
    // Look for poor error handling patterns
    const errorPatterns = [
      { pattern: /catch\s*\(\s*[^)]*\)\s*\{\s*\}/g, issue: 'Empty catch blocks' },
      { pattern: /catch\s*\(\s*[^)]*\)\s*\{\s*console\.log/g, issue: 'Console.log in catch blocks' },
      { pattern: /catch\s*\(\s*[^)]*\)\s*\{\s*return/g, issue: 'Silent error swallowing' },
      { pattern: /throw\s+new\s+Error\(\s*['"`][^'"`]*['"`]\s*\)/g, issue: 'Generic error messages' },
      { pattern: /async\s+function[^{]*\{[^}]*(?!try)[^}]*await/g, issue: 'Async function without try-catch' }
    ];

    errorPatterns.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          file: fileName,
          type: 'ERROR_HANDLING',
          severity: 'HIGH',
          message: `${issue}: Found ${matches.length} instances`,
          examples: matches.slice(0, 2)
        });
      }
    });
  }

  checkAsyncIssues(content, fileName) {
    // Look for async/await problems
    const asyncPatterns = [
      { pattern: /await[^;]*await/g, issue: 'Multiple awaits that could be parallel' },
      { pattern: /for\s*\([^)]*\)\s*\{[^}]*await/g, issue: 'Await in for loop (potential performance issue)' },
      { pattern: /forEach[^}]*await/g, issue: 'Await in forEach (won\'t work as expected)' },
      { pattern: /Promise\.all\(\s*\[[\s\S]*?\]\s*\)/g, issue: 'Promise.all usage' },
      { pattern: /new\s+Promise\s*\(/g, issue: 'Manual Promise construction' }
    ];

    asyncPatterns.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        const severity = issue.includes('won\'t work') ? 'HIGH' : 'MEDIUM';
        this.issues.push({
          file: fileName,
          type: 'ASYNC_ISSUE',
          severity,
          message: `${issue}: Found ${matches.length} instances`,
          examples: matches.slice(0, 2)
        });
      }
    });
  }

  checkTypeSafety(content, fileName) {
    // Look for type safety issues
    const typePatterns = [
      { pattern: /@ts-ignore/g, issue: 'TypeScript ignore comments' },
      { pattern: /\?\.\w+\?\./g, issue: 'Multiple optional chaining (potential over-defensive)' },
      { pattern: /typeof\s+[^=]+\s*===\s*['"`]undefined['"`]/g, issue: 'Manual undefined checks' },
      { pattern: /==\s*null|null\s*==/g, issue: 'Loose equality with null' },
      { pattern: /any\s*\*/g, issue: 'TypeScript any type usage' }
    ];

    typePatterns.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          file: fileName,
          type: 'TYPE_SAFETY',
          severity: 'MEDIUM',
          message: `${issue}: Found ${matches.length} instances`,
          examples: matches.slice(0, 3)
        });
      }
    });
  }

  checkComplexity(content, fileName) {
    // Check for high complexity indicators
    const complexityIndicators = [
      { pattern: /if\s*\([^)]*&&[^)]*&&[^)]*\)/g, issue: 'Complex boolean conditions' },
      { pattern: /function[^{]*\{[\s\S]{1000,}?\}/g, issue: 'Very long functions (>1000 chars)' },
      { pattern: /for\s*\([^)]*\)\s*\{[\s\S]*?for\s*\([^)]*\)\s*\{[\s\S]*?for/g, issue: 'Triple nested loops' },
      { pattern: /switch\s*\([^)]*\)\s*\{[\s\S]*?case[\s\S]*?case[\s\S]*?case[\s\S]*?case[\s\S]*?case[\s\S]*?case/g, issue: 'Large switch statements (6+ cases)' }
    ];

    complexityIndicators.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          file: fileName,
          type: 'COMPLEXITY',
          severity: 'MEDIUM',
          message: `${issue}: Found ${matches.length} instances`
        });
      }
    });

    // Count lines of code
    const lines = content.split('\n').length;
    if (lines > 1000) {
      this.issues.push({
        file: fileName,
        type: 'COMPLEXITY',
        severity: 'HIGH',
        message: `Very large file: ${lines} lines of code`
      });
    }
  }

  checkMemoryLeaks(content, fileName) {
    // Look for potential memory leak patterns
    const memoryPatterns = [
      { pattern: /setInterval\(/g, issue: 'setInterval without clearInterval' },
      { pattern: /addEventListener\(/g, issue: 'Event listeners without removal' },
      { pattern: /new\s+Array\(\d{4,}\)/g, issue: 'Large array pre-allocation' },
      { pattern: /while\s*\(\s*true\s*\)/g, issue: 'Infinite while loops' },
      { pattern: /for\s*\(\s*;\s*;\s*\)/g, issue: 'Infinite for loops' }
    ];

    memoryPatterns.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          file: fileName,
          type: 'MEMORY_LEAK',
          severity: 'HIGH',
          message: `${issue}: Found ${matches.length} instances`,
          examples: matches.slice(0, 2)
        });
      }
    });
  }

  checkSecurity(content, fileName) {
    // Look for security issues
    const securityPatterns = [
      { pattern: /eval\s*\(/g, issue: 'Use of eval() function' },
      { pattern: /innerHTML\s*=/g, issue: 'Direct innerHTML assignment' },
      { pattern: /exec\s*\(/g, issue: 'Command execution' },
      { pattern: /password|secret|key/gi, issue: 'Potential credential exposure' },
      { pattern: /Math\.random\(\)/g, issue: 'Non-cryptographic random number generation' }
    ];

    securityPatterns.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          file: fileName,
          type: 'SECURITY',
          severity: 'HIGH',
          message: `${issue}: Found ${matches.length} instances`,
          examples: matches.slice(0, 2)
        });
      }
    });
  }

  checkPerformance(content, fileName) {
    // Look for performance issues
    const performancePatterns = [
      { pattern: /JSON\.parse\(JSON\.stringify\(/g, issue: 'Deep copy via JSON (inefficient)' },
      { pattern: /\+\s*new\s+Date\(\)/g, issue: 'Inefficient date creation' },
      { pattern: /document\.getElementById\([^)]*\)/g, issue: 'Repeated DOM queries' },
      { pattern: /for\s*\([^)]*\.length[^)]*\)/g, issue: 'Length calculation in loop condition' }
    ];

    performancePatterns.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          file: fileName,
          type: 'PERFORMANCE',
          severity: 'MEDIUM',
          message: `${issue}: Found ${matches.length} instances`,
          examples: matches.slice(0, 2)
        });
      }
    });
  }

  generateReport() {
    console.log('\n🚨 DEEP INSPECTION RESULTS:\n');
    
    if (this.issues.length === 0) {
      console.log('😱 SUSPICIOUS: No issues found... digging deeper...\n');
      return this.generateSuspiciousAnalysis();
    }

    // Group by severity
    const highSeverity = this.issues.filter(i => i.severity === 'HIGH');
    const mediumSeverity = this.issues.filter(i => i.severity === 'MEDIUM');
    const lowSeverity = this.issues.filter(i => i.severity === 'LOW');

    console.log(`📊 TOTAL ISSUES FOUND: ${this.issues.length}`);
    console.log(`🔴 HIGH SEVERITY: ${highSeverity.length}`);
    console.log(`🟡 MEDIUM SEVERITY: ${mediumSeverity.length}`);
    console.log(`🟢 LOW SEVERITY: ${lowSeverity.length}\n`);

    // Show high severity issues first
    if (highSeverity.length > 0) {
      console.log('🔴 HIGH SEVERITY ISSUES:');
      highSeverity.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.file} - ${issue.type}`);
        console.log(`   ${issue.message}`);
        if (issue.examples) {
          console.log(`   Examples: ${issue.examples.join(', ')}`);
        }
        console.log('');
      });
    }

    // Show medium severity issues
    if (mediumSeverity.length > 0) {
      console.log('🟡 MEDIUM SEVERITY ISSUES:');
      mediumSeverity.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.file} - ${issue.type}`);
        console.log(`   ${issue.message}`);
        console.log('');
      });
    }

    return {
      totalIssues: this.issues.length,
      highSeverity: highSeverity.length,
      mediumSeverity: mediumSeverity.length,
      lowSeverity: lowSeverity.length,
      issues: this.issues
    };
  }

  generateSuspiciousAnalysis() {
    console.log('🕵️ SUSPICIOUS PATTERNS ANALYSIS:\n');
    console.log('Even "clean" code has hidden issues. Let me check what the surface analysis missed...\n');
    
    // This would be suspicious - let's check what we actually found
    const report = {
      suspiciouslyClean: true,
      possibleReasons: [
        'Code is actually well-written (rare)',
        'Issues are subtle and need runtime analysis',
        'Problems are in configuration or environment',
        'Hardcoded responses masking real functionality'
      ],
      recommendation: 'Run runtime analysis with real data to find issues'
    };
    
    console.log('🤔 ANALYSIS: Code appears suspiciously clean');
    console.log('💭 POSSIBLE REASONS:');
    report.possibleReasons.forEach((reason, i) => {
      console.log(`   ${i + 1}. ${reason}`);
    });
    console.log(`\n💡 RECOMMENDATION: ${report.recommendation}`);
    
    return report;
  }
}

// Main execution
async function main() {
  const inspector = new DeepInspector();
  await inspector.analyzeAllFiles();
  const report = inspector.generateReport();
  
  // Write detailed report
  await fs.writeFile(
    '/Users/bretmeraki/Desktop/claude-mcp-configs/forest-server/deep-inspection-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to: deep-inspection-report.json');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DeepInspector };