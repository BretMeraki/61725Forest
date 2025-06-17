# Forest MCP Server - Comprehensive Stack Trace Analysis

## 📊 Executive Summary
- **Analysis Date**: 2025-06-15T20:16:49.552Z
- **Total Modules**: 17
- **Execution Events**: 39
- **Errors Detected**: 0
- **Memory Usage**: 10MB

## 🏗️ Architecture Analysis

### Module Complexity (Top 5)
- **constants.js**: 15 complexity (0 deps, 15 exports)
- **errors.js**: 12 complexity (0 deps, 12 exports)
- **core-infrastructure.js**: 7 complexity (6 deps, 1 exports)
- **data-persistence.js**: 3 complexity (2 deps, 1 exports)
- **mcp-handlers.js**: 2 complexity (1 deps, 1 exports)

### Dependency Graph
- constants.js → []
- errors.js → []
- core-infrastructure.js → [@modelcontextprotocol/sdk/server/index.js, @modelcontextprotocol/sdk/server/stdio.js, fs/promises, path, os, http]
- data-persistence.js → [fs/promises, path]
- mcp-handlers.js → [@modelcontextprotocol/sdk/types.js]
- tool-router.js → [@modelcontextprotocol/sdk/types.js]
- analytics-tools.js → []
- hta-status.js → []
- hta-tree-builder.js → []
- identity-engine.js → []
- llm-integration.js → []
- memory-sync.js → []
- project-management.js → []
- reasoning-engine.js → []
- schedule-generator.js → []
- task-completion.js → []
- task-intelligence.js → []

## ⚡ Performance Analysis

### Execution by Context
- **StackTraceAnalyzer**: 5 operations
- **undefined**: 5 operations
- **ModuleLoader**: 17 operations
- **ServerCreation**: 2 operations
- **OperationTest**: 6 operations
- **StatusReporting**: 2 operations
- **ClaudeIntegration**: 2 operations

### Performance Metrics
- **OperationTest**: avg 1ms, max 2ms
- **StatusReporting**: avg 1ms, max 1ms

## 🚨 Error Analysis

### Error Distribution


### Critical Issues
No critical errors detected ✅

## 🔍 Call Stack Analysis
- **Current Stack Depth**: 0
- **Active Calls**: 

## 💾 System Resources
- **Heap Used**: 10MB
- **Heap Total**: 18MB
- **External**: 4MB
- **RSS**: 59MB

## 📈 Recommendations

✅ **Server Health**: Excellent - No critical issues detected

🔧 **Architecture**: Consider module consolidation for ${dependencies.totalModules} modules

✅ **Performance**: Normal execution levels
