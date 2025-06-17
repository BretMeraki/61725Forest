/**
 * Forest Server Constants
 * Centralized configuration values to eliminate hardcoded strings
 */

// File naming constants
export const FILE_NAMES = {
  CONFIG: 'config.json',
  HTA: 'hta.json',
  LEARNING_HISTORY: 'learning_history.json',
  ERROR_LOG: 'error.log',
  MEMORY_STATE: 'memory_state.json',
  
  // Dynamic file name generators
  DAILY_SCHEDULE: (date) => `day_${date}.json`,
  PATH_CONFIG: (path) => `${path}_config.json`,
  BACKUP: (filename, timestamp) => `${filename}.backup.${timestamp}`,
};

// Directory structure constants
export const DIRECTORIES = {
  PROJECTS: 'projects',
  PATHS: 'paths',
  BACKUPS: 'backups',
  LOGS: 'logs',
  TEMP: 'temp'
};

// Default data directory
export const DEFAULT_DATA_DIR = '.forest-data';

// Server configuration
export const SERVER_CONFIG = {
  DEFAULT_PORT: 3001,
  LOCALHOST: 'localhost',
  HTTP_TIMEOUT: 30000,
  MAX_REQUEST_SIZE: '10mb'
};

// Performance constants
export const PERFORMANCE = {
  BATCH_SIZE: 10,
  MAX_CONCURRENT: 5,
  CACHE_TTL: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Validation constants
export const VALIDATION = {
  MIN_PROJECT_ID_LENGTH: 1,
  MAX_PROJECT_ID_LENGTH: 50,
  MIN_GOAL_LENGTH: 10,
  MAX_GOAL_LENGTH: 500,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_EXTENSIONS: ['.json', '.txt', '.md']
};

// Logging levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
};

// Task and HTA constants
export const TASK_CONFIG = {
  MIN_DIFFICULTY: 1,
  MAX_DIFFICULTY: 10,
  DEFAULT_DIFFICULTY: 5,
  MIN_ENERGY_LEVEL: 1,
  MAX_ENERGY_LEVEL: 10,
  DEFAULT_DURATION: 30, // minutes
  MAX_DURATION: 480 // 8 hours
};

// Memory sync constants
export const MEMORY_SYNC = {
  SYNC_INTERVAL: 60000, // 1 minute
  MAX_HISTORY_ITEMS: 100,
  COMPRESSION_THRESHOLD: 1000
};

// Error handling constants
export const ERROR_CONFIG = {
  MAX_STACK_TRACE_LENGTH: 2000,
  MAX_ERROR_LOG_SIZE: 50 * 1024 * 1024, // 50MB
  ERROR_RETENTION_DAYS: 30
};

// Claude integration constants
export const CLAUDE_CONFIG = {
  MAX_PROMPT_LENGTH: 8000,
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  BACKOFF_MULTIPLIER: 2
};

// Path constants for common operations
export const PATHS = {
  HOME: () => process.env.HOME || process.env.USERPROFILE,
  DATA_DIR: () => process.env.FOREST_DATA_DIR || `${PATHS.HOME()}/${DEFAULT_DATA_DIR}`,
  PROJECT_DIR: (projectId) => `${PATHS.DATA_DIR()}/${DIRECTORIES.PROJECTS}/${projectId}`,
  PATH_DIR: (projectId, pathName) => `${PATHS.PROJECT_DIR(projectId)}/${DIRECTORIES.PATHS}/${pathName}`
};

// Tool names for MCP
export const TOOL_NAMES = {
  CREATE_PROJECT: 'create_project',
  SWITCH_PROJECT: 'switch_project',
  LIST_PROJECTS: 'list_projects',
  BUILD_HTA_TREE: 'build_hta_tree',
  GET_NEXT_TASK: 'get_next_task',
  COMPLETE_BLOCK: 'complete_block',
  GENERATE_SCHEDULE: 'generate_daily_schedule',
  CURRENT_STATUS: 'current_status',
  ANALYZE_REASONING: 'analyze_reasoning',
  ASK_TRUTHFUL_CLAUDE: 'ask_truthful_claude'
};

// Default values
export const DEFAULTS = {
  PROJECT: {
    learningStyle: 'adaptive',
    energyLevel: 7,
    availableHours: 8,
    focusType: 'balanced'
  },
  HTA: {
    maxDepth: 5,
    minTasksPerBranch: 3,
    maxTasksPerBranch: 10
  },
  SCHEDULE: {
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 15,
    lunchDuration: 60
  }
};

// Time format constants
export const TIME_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm',
  DATETIME: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  FILENAME_SAFE: 'YYYY-MM-DD_HH-mm-ss'
};

export default {
  FILE_NAMES,
  DIRECTORIES,
  DEFAULT_DATA_DIR,
  SERVER_CONFIG,
  PERFORMANCE,
  VALIDATION,
  LOG_LEVELS,
  TASK_CONFIG,
  MEMORY_SYNC,
  ERROR_CONFIG,
  CLAUDE_CONFIG,
  PATHS,
  TOOL_NAMES,
  DEFAULTS,
  TIME_FORMATS
};