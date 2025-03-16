/**
 * Logger utility for the Universal Translator app
 * Provides centralized logging with configurable levels and formatting
 */

// Log levels in order of increasing severity
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4, // Used to disable logging entirely
};

// Default configuration
const DEFAULT_CONFIG = {
  logLevel: __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR, // Show all logs in dev, only errors in production
  enableTimestamp: true,
  enableComponentName: true,
};

// Current configuration (can be modified at runtime)
let config = { ...DEFAULT_CONFIG };

/**
 * Configure the logger
 * @param {Object} newConfig - Configuration options
 */
export const configureLogger = (newConfig = {}) => {
  config = { ...config, ...newConfig };
};

/**
 * Format a log message with optional timestamp and component name
 * @param {string} level - The log level string (DEBUG, INFO, etc.)
 * @param {string} message - The main log message
 * @param {string} [componentName] - Optional component name for context
 * @returns {string} Formatted log message
 */
const formatMessage = (level, message, componentName) => {
  const parts = [];
  
  if (config.enableTimestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  parts.push(`[${level}]`);
  
  if (config.enableComponentName && componentName) {
    parts.push(`[${componentName}]`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
};

/**
 * Main logger object with methods for different log levels
 */
export const logger = {
  /**
   * Log a debug message (development only)
   * @param {string} message - Message to log
   * @param {string} [componentName] - Optional component name
   * @param {...any} args - Additional arguments to log
   */
  debug: (message, componentName, ...args) => {
    if (config.logLevel <= LOG_LEVELS.DEBUG) {
      const formattedMessage = formatMessage('DEBUG', message, componentName);
      console.log(formattedMessage, ...args);
    }
  },
  
  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {string} [componentName] - Optional component name
   * @param {...any} args - Additional arguments to log
   */
  info: (message, componentName, ...args) => {
    if (config.logLevel <= LOG_LEVELS.INFO) {
      const formattedMessage = formatMessage('INFO', message, componentName);
      console.log(formattedMessage, ...args);
    }
  },
  
  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {string} [componentName] - Optional component name
   * @param {...any} args - Additional arguments to log
   */
  warn: (message, componentName, ...args) => {
    if (config.logLevel <= LOG_LEVELS.WARN) {
      const formattedMessage = formatMessage('WARN', message, componentName);
      console.warn(formattedMessage, ...args);
    }
  },
  
  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {string} [componentName] - Optional component name
   * @param {...any} args - Additional arguments to log
   */
  error: (message, componentName, ...args) => {
    if (config.logLevel <= LOG_LEVELS.ERROR) {
      const formattedMessage = formatMessage('ERROR', message, componentName);
      console.error(formattedMessage, ...args);
    }
  },
  
  /**
   * Log component lifecycle events (useful for debugging)
   * @param {string} componentName - Name of the component
   * @param {string} lifecycleHook - Name of the lifecycle hook
   * @param {...any} args - Additional arguments to log
   */
  lifecycle: (componentName, lifecycleHook, ...args) => {
    if (config.logLevel <= LOG_LEVELS.DEBUG && __DEV__) {
      const message = formatMessage('LIFECYCLE', `${lifecycleHook}`, componentName);
      console.log(message, ...args);
    }
  },
  
  /**
   * Log API requests and responses (helpful for debugging network issues)
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint
   * @param {Object} [data] - Request/response data
   */
  api: (method, url, data) => {
    if (config.logLevel <= LOG_LEVELS.DEBUG && __DEV__) {
      const message = formatMessage('API', `${method} ${url}`, 'ApiService');
      console.log(message, data || '');
    }
  }
};

// Export a default instance
export default logger; 