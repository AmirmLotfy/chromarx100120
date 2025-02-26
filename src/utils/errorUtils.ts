
import { toast } from "sonner";

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

export function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  {
    errorMessage = "An error occurred",
    showError = true,
    rethrow = false,
  }: {
    errorMessage?: string;
    showError?: boolean;
    rethrow?: boolean;
  } = {}
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    if (showError) {
      toast.error(errorMessage, {
        description: getErrorMessage(error)
      });
    }
    
    if (rethrow) throw error;
  }
}

export function createErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  errorHandler: (error: unknown) => void
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(error);
    }
  };
}

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(operation, retries - 1, delay * 2);
  }
};
