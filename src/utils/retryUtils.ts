
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (error: any, attempt: number) => void;
}

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry = (error, attempt) => 
      console.log(`Retry attempt ${attempt} after error:`, error)
  } = options;

  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        throw error;
      }

      onRetry(error, retries);
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, maxDelay)));
      delay *= 2; // Exponential backoff
    }
  }
};
