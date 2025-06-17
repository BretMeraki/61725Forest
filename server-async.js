#!/usr/bin/env node
// @ts-check

/* eslint-disable */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as http from "http";
import * as net from 'net';

// Import all modular components - USING CLEAN VERSIONS
import { CoreInfrastructure } from "./modules/core-infrastructure.js";
import { McpHandlers } from "./modules/mcp-handlers.js";
import { ToolRouter } from "./modules/tool-router.js";
import { DataPersistence } from "./modules/data-persistence.js";
import { MemorySync } from "./modules/memory-sync.js";
import { ProjectManagement } from "./modules/project-management.js";
import { HtaTreeBuilder } from "./modules/hta-tree-builder.js";
import { HtaStatus } from "./modules/hta-status.js";
import { ScheduleGenerator } from "./modules/schedule-generator.js";
import { TaskCompletion } from "./modules/task-completion.js";
import { ReasoningEngine } from "./modules/reasoning-engine.js";
import { TaskIntelligence } from "./modules/task-intelligence.js";
import { AnalyticsTools } from "./modules/analytics-tools.js";
import { LlmIntegration } from "./modules/llm-integration.js";
import { IdentityEngine } from "./modules/identity-engine.js";

// Debug infrastructure (load CommonJS modules safely)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require("../debug/debug-core.js");
const { ForestDebugIntegration } = require("../debug/debug-integration.js");

/**
 * Async Forest Server Class - Optimized with async initialization
 * Orchestrates all the specialized modules to provide a cohesive MCP server experience
 */
class AsyncForestServer {
  constructor() {
    console.error("🏗️ AsyncForestServer constructor starting...");
    this.initialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.initialized) {
      return this;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    await this.initializationPromise;
    return this;
  }

  async _performInitialization() {
    try {
      console.error("🚀 Starting async initialization...");

      // Initialize core infrastructure
      this.core = new CoreInfrastructure();

      // Initialize data layer
      this.dataPersistence = new DataPersistence(this.core.getDataDir());

      // Initialize memory and sync layer
      this.memorySync = new MemorySync(this.dataPersistence);

      // Initialize project management
      this.projectManagement = new ProjectManagement(
        this.dataPersistence,
        this.memorySync,
      );

      // Expose Claude interface to modules that need reasoning
      const claude = this.core.getClaudeInterface();

      // Initialize modules in parallel where possible
      const [
        htaTreeBuilder,
        htaStatus,
        scheduleGenerator,
        taskCompletion,
        reasoningEngine,
        taskIntelligence,
        analyticsTools,
        llmIntegration,
        identityEngine
      ] = await Promise.all([
        // HTA system - USING CLEAN VERSIONS
        this._initializeModule(() => new HtaTreeBuilder(
          this.dataPersistence,
          this.projectManagement,
          claude
        )),
        this._initializeModule(() => new HtaStatus(
          this.dataPersistence,
          this.projectManagement
        )),
        this._initializeModule(() => new ScheduleGenerator(
          this.dataPersistence,
          this.projectManagement,
          claude
        )),
        this._initializeModule(() => new TaskCompletion(
          this.dataPersistence,
          this.memorySync,
          this.projectManagement,
          claude
        )),
        this._initializeModule(() => new ReasoningEngine(
          this.dataPersistence,
          this.projectManagement,
          claude
        )),
        this._initializeModule(() => new TaskIntelligence(
          this.dataPersistence,
          this.projectManagement
        )),
        this._initializeModule(() => new AnalyticsTools(
          this.dataPersistence,
          this.projectManagement
        )),
        this._initializeModule(() => new LlmIntegration(
          this.dataPersistence,
          this.projectManagement,
          claude
        )),
        this._initializeModule(() => new IdentityEngine(
          this.dataPersistence,
          this.projectManagement
        ))
      ]);

      // Assign initialized modules
      this.htaTreeBuilder = htaTreeBuilder;
      this.htaStatus = htaStatus;
      this.scheduleGenerator = scheduleGenerator;
      this.taskCompletion = taskCompletion;
      this.reasoningEngine = reasoningEngine;
      this.taskIntelligence = taskIntelligence;
      this.analyticsTools = analyticsTools;
      this.llmIntegration = llmIntegration;
      this.identityEngine = identityEngine;

      // Initialize routing and debugging
      this.toolRouter = new ToolRouter(this);
      this.debugIntegration = new ForestDebugIntegration(this);

      // VERY LAST: Initialize MCP handlers after everything is ready
      this.mcpHandlers = new McpHandlers(this);

      this.initialized = true;
      console.error("✓ AsyncForestServer initialization completed");

    } catch (error) {
      console.error("❌ Initialization failed:", error);
      throw error;
    }
  }

  async _initializeModule(moduleFactory) {
    try {
      return moduleFactory();
    } catch (error) {
      console.error("Module initialization failed:", error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Delegate method calls to ensure initialization
  async createAsyncWrapper(methodName, originalMethod) {
    return async (...args) => {
      await this.ensureInitialized();
      return originalMethod.apply(this, args);
    };
  }

  // Startup methods - same as original
  async startForest() {
    await this.ensureInitialized();
    
    console.error("🚀 Starting Clean Forest MCP Server...");

    this.server = this.core.createServer();
    this.mcpHandlers.setupHandlers();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error("🌳 Clean Forest MCP Server v2 started successfully!");
  }

  async startWithHttp(port = 3001) {
    await this.ensureInitialized();
    
    console.error("🚀 Starting Clean Forest MCP Server - NO HARDCODED RESPONSES...");

    this.server = this.core.createServer();
    this.mcpHandlers.setupHandlers();

    const httpServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'Forest MCP Server Running',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }));
    });

    const desiredPort = port;
    httpServer.listen(desiredPort, () => {
      const addr = httpServer.address();
      const actualPort = addr ? addr.port : desiredPort;
      console.error(`📡 HTTP API running on http://localhost:${actualPort}`);
    });
  }

  // Proxy all other methods from original class (add them as needed)
  // This ensures backward compatibility
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AsyncForestServer();
  server.startForest().catch(console.error);
}

export { AsyncForestServer };
export default AsyncForestServer;