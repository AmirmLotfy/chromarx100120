
/**
 * A utility function for handling async operations with proper error handling
 * @param promise The promise to handle
 * @returns A tuple with the result and error
 */
export const handleAsync = async <T>(
  promise: Promise<T>
): Promise<[T | null, Error | null]> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
};

/**
 * Creates a rejection handler for promises that formats errors nicely
 * @param operation Name of the operation that failed
 * @returns A function that handles the rejection
 */
export const createRejectionHandler = (operation: string) => (error: any) => {
  console.error(`${operation} failed:`, error);
  
  // Normalize error object
  const normalizedError = error instanceof Error 
    ? error 
    : new Error(typeof error === 'string' ? error : JSON.stringify(error));
  
  throw normalizedError;
};

/**
 * Error handling options for the withErrorHandling function
 */
interface ErrorHandlingOptions {
  /** Custom error message to display */
  errorMessage?: string;
  /** Whether to show an error toast */
  showError?: boolean;
  /** Whether to rethrow the error after handling */
  rethrow?: boolean;
  /** Custom function to handle the error */
  onError?: (error: Error) => void;
  /** Function to run regardless of success or failure */
  finally?: () => void;
  /** Log error with extension logger */
  log?: boolean;
  /** Add metadata to error logs */
  logMetadata?: Record<string, any>;
}

/**
 * A higher-order function that wraps async operations with consistent error handling
 * @param fn The async function to execute
 * @param options Error handling options
 * @returns A promise that resolves to the result of the function
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<T> => {
  const {
    errorMessage = "An error occurred",
    showError = false,
    rethrow = true,
    onError,
    finally: finallyFn,
    log = true,
    logMetadata = {},
  } = options;

  try {
    return await fn();
  } catch (error) {
    const normalizedError = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : JSON.stringify(error));
    
    console.error(errorMessage, normalizedError);
    
    // Use logger if available
    if (log) {
      try {
        const { logger } = await import('@/utils/loggerUtils');
        logger.error(errorMessage, normalizedError, { meta: logMetadata });
      } catch (logError) {
        // If logger import fails, fallback to console
        console.error('Logger not available:', logError);
      }
    }
    
    if (showError) {
      // Import toast dynamically to avoid circular dependencies
      const { toast } = await import('sonner');
      toast.error(errorMessage);
    }
    
    if (onError) {
      onError(normalizedError);
    }
    
    if (rethrow) {
      throw normalizedError;
    }
    
    // Return a dummy value if not rethrowing
    return undefined as unknown as T;
  } finally {
    if (finallyFn) {
      finallyFn();
    }
  }
};

/**
 * An error class for extension-specific errors with additional context
 */
export class ExtensionError extends Error {
  code: string;
  context: Record<string, any>;
  
  constructor(message: string, code: string = 'EXTENSION_ERROR', context: Record<string, any> = {}) {
    super(message);
    this.name = 'ExtensionError';
    this.code = code;
    this.context = context;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ExtensionError.prototype);
  }
  
  /**
   * Creates a formatted error object for API responses
   */
  toJSON() {
    return {
      error: true,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: new Date().toISOString()
    };
  }
}
