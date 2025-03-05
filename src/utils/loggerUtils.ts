
/**
 * Centralized logging utility for the extension
 * Provides consistent logging and error reporting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  /** Whether to include timestamp */
  timestamp?: boolean;
  /** Whether to send to remote monitoring (if available) */
  remote?: boolean;
  /** Additional metadata to include */
  meta?: Record<string, any>;
}

const defaultOptions: LogOptions = {
  timestamp: true,
  remote: false,
  meta: {}
};

/**
 * Safe stringify function that handles circular references
 */
const safeStringify = (obj: any): string => {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular Reference]';
      }
      cache.add(value);
    }
    return value;
  }, 2);
};

/**
 * Sanitizes logs to remove sensitive information
 */
const sanitizeLogData = (data: any): any => {
  if (!data) return data;
  
  // Create a deep copy to avoid modifying the original
  const sanitized = JSON.parse(safeStringify(data));
  
  // Remove common sensitive fields
  const sensitiveKeys = [
    'password', 'token', 'apiKey', 'secret', 'credentials', 'auth',
    'authorization', 'jwt', 'access_token', 'refresh_token', 'key',
    'geminiApiKey', 'secretKey', 'clientId', 'client_secret'
  ];
  
  const sensitize = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        obj[key] = typeof obj[key] === 'string' ? '***REDACTED***' : null;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sensitize(obj[key]);
      }
    });
  };
  
  sensitize(sanitized);
  return sanitized;
};

/**
 * Extension logger that handles various log levels and formats
 */
export const logger = {
  debug: (message: string, data?: any, options: LogOptions = {}) => {
    const opts = { ...defaultOptions, ...options };
    console.debug(
      `[DEBUG]${opts.timestamp ? ` [${new Date().toISOString()}]` : ''} ${message}`,
      data ? sanitizeLogData(data) : ''
    );
  },
  
  info: (message: string, data?: any, options: LogOptions = {}) => {
    const opts = { ...defaultOptions, ...options };
    console.info(
      `[INFO]${opts.timestamp ? ` [${new Date().toISOString()}]` : ''} ${message}`,
      data ? sanitizeLogData(data) : ''
    );
  },
  
  warn: (message: string, data?: any, options: LogOptions = {}) => {
    const opts = { ...defaultOptions, ...options };
    console.warn(
      `[WARN]${opts.timestamp ? ` [${new Date().toISOString()}]` : ''} ${message}`,
      data ? sanitizeLogData(data) : ''
    );
  },
  
  error: (message: string, error?: any, options: LogOptions = {}) => {
    const opts = { ...defaultOptions, ...options };
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    console.error(
      `[ERROR]${opts.timestamp ? ` [${new Date().toISOString()}]` : ''} ${message}`,
      sanitizeLogData({
        message: errorObj.message,
        stack: errorObj.stack,
        ...opts.meta
      })
    );
    
    // If remote logging is enabled, we would send to a service like Sentry here
    if (opts.remote) {
      // Future integration point for remote error reporting services
    }
  },
  
  /**
   * Logs and handles extension errors
   */
  handleExtensionError: (message: string, error: any, options: LogOptions = {}) => {
    logger.error(message, error, options);
    
    // Return a standardized error object
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Creates a namespaced logger for a specific component or module
 */
export const createNamespacedLogger = (namespace: string) => {
  return {
    debug: (message: string, data?: any, options: LogOptions = {}) => 
      logger.debug(`[${namespace}] ${message}`, data, options),
    info: (message: string, data?: any, options: LogOptions = {}) => 
      logger.info(`[${namespace}] ${message}`, data, options),
    warn: (message: string, data?: any, options: LogOptions = {}) => 
      logger.warn(`[${namespace}] ${message}`, data, options),
    error: (message: string, error?: any, options: LogOptions = {}) => 
      logger.error(`[${namespace}] ${message}`, error, options),
    handleExtensionError: (message: string, error: any, options: LogOptions = {}) => 
      logger.handleExtensionError(`[${namespace}] ${message}`, error, options)
  };
};
