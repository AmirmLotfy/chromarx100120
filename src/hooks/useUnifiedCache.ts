
import { useState, useEffect, useCallback } from 'react';
import { unifiedCache, CacheOptions } from '@/utils/unifiedCacheManager';
import { toast } from 'sonner';

interface UseCacheResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: (options?: CacheOptions) => Promise<void>;
  isOffline: boolean;
}

/**
 * Hook for using the unified cache system in components
 */
export function useUnifiedCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {},
  dependencies: any[] = []
): UseCacheResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(unifiedCache.isInOfflineMode());

  const fetchData = useCallback(async (fetchOptions: CacheOptions = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const mergedOptions = { ...options, ...fetchOptions };
      const result = await unifiedCache.getData<T>(cacheKey, fetchFn, mergedOptions);
      setData(result);
    } catch (err) {
      console.error(`Error fetching data for ${cacheKey}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      if (unifiedCache.isInOfflineMode()) {
        toast.error("You're offline. Cannot fetch fresh data.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetchFn, options]);
  
  const handleOfflineChange = useCallback(() => {
    setIsOffline(unifiedCache.isInOfflineMode());
  }, []);

  // Set up event listeners for online/offline state
  useEffect(() => {
    window.addEventListener('cache-manager-online', handleOfflineChange);
    window.addEventListener('cache-manager-offline', handleOfflineChange);
    window.addEventListener('online', handleOfflineChange);
    window.addEventListener('offline', handleOfflineChange);
    
    return () => {
      window.removeEventListener('cache-manager-online', handleOfflineChange);
      window.removeEventListener('cache-manager-offline', handleOfflineChange);
      window.removeEventListener('online', handleOfflineChange);
      window.removeEventListener('offline', handleOfflineChange);
    };
  }, [handleOfflineChange]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    isOffline
  };
}

export default useUnifiedCache;
