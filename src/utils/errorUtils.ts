
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
  } = options;

  try {
    return await fn();
  } catch (error) {
    const normalizedError = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : JSON.stringify(error));
    
    console.error(errorMessage, normalizedError);
    
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
