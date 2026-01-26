/**
 * Frontend Logging Utility
 * Provides structured logging across the application
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const getCurrentLogLevel = () => {
  const level = import.meta.env.VITE_LOG_LEVEL || 'INFO';
  return LOG_LEVELS[level] || LOG_LEVELS.INFO;
};

const formatLogMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  
  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
};

const logger = {
  debug: (message, data) => {
    if (getCurrentLogLevel() <= LOG_LEVELS.DEBUG) {
      formatLogMessage('DEBUG', message, data);
    }
  },

  info: (message, data) => {
    if (getCurrentLogLevel() <= LOG_LEVELS.INFO) {
      formatLogMessage('INFO', message, data);
    }
  },

  warn: (message, data) => {
    if (getCurrentLogLevel() <= LOG_LEVELS.WARN) {
      console.warn(`[${new Date().toISOString()}] [WARN]`, message, data || '');
    }
  },

  error: (message, error) => {
    if (getCurrentLogLevel() <= LOG_LEVELS.ERROR) {
      console.error(`[${new Date().toISOString()}] [ERROR]`, message, error || '');
    }
  },
};

export default logger;
