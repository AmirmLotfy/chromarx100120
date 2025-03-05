
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
