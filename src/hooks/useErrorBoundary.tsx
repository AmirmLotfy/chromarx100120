
import { useCallback, useState } from "react";

export function useErrorBoundary(): {
  showBoundary: (error: Error) => void;
  resetBoundary: () => void;
  error: Error | null;
} {
  const [error, setError] = useState<Error | null>(null);

  const showBoundary = useCallback((error: Error) => {
    setError(error);
    throw error;
  }, []);

  const resetBoundary = useCallback(() => {
    setError(null);
  }, []);

  return { showBoundary, resetBoundary, error };
}
