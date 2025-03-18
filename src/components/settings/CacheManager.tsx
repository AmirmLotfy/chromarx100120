
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { unifiedCache } from '@/utils/unifiedCacheManager';
import { toast } from 'sonner';

export function CacheManager() {
  const [cacheStats, setCacheStats] = useState<{
    memoryEntries: number;
    persistentEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  
  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const stats = await unifiedCache.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearAllCaches = async () => {
    if (window.confirm('Are you sure you want to clear all caches? This may make some operations slower next time.')) {
      setIsClearing(true);
      try {
        await unifiedCache.invalidateAllCaches();
        toast.success('All caches cleared successfully');
        await refreshStats();
      } catch (error) {
        console.error('Error clearing caches:', error);
        toast.error('Failed to clear caches');
      } finally {
        setIsClearing(false);
      }
    }
  };
  
  const clearSpecificCaches = async (prefix: string) => {
    setIsClearing(true);
    try {
      await unifiedCache.invalidateCachesByPrefix(prefix);
      toast.success(`Cleared ${prefix} caches`);
      await refreshStats();
    } catch (error) {
      console.error(`Error clearing ${prefix} caches:`, error);
      toast.error(`Failed to clear ${prefix} caches`);
    } finally {
      setIsClearing(false);
    }
  };
  
  useEffect(() => {
    refreshStats();
  }, []);
  
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cache Management</CardTitle>
        <CardDescription>
          Manage cached data across the application
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading cache information...</div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Memory Cache</span>
                <Badge variant="secondary">
                  {cacheStats?.memoryEntries || 0} entries
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Persistent Cache</span>
                <Badge variant="secondary">
                  {cacheStats?.persistentEntries || 0} entries
                </Badge>
              </div>
              
              {cacheStats?.persistentEntries && cacheStats.persistentEntries > 0 ? (
                <Progress 
                  value={100} 
                  className="h-2"
                />
              ) : (
                <Progress 
                  value={0} 
                  className="h-2"
                />
              )}
              
              <div className="text-sm text-muted-foreground mt-2">
                <div>Oldest cached item: {formatDate(cacheStats?.oldestEntry)}</div>
                <div>Newest cached item: {formatDate(cacheStats?.newestEntry)}</div>
              </div>
              
              <div className="space-y-2 mt-4">
                <h3 className="font-medium">Clear Specific Caches</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearSpecificCaches('gemini')}
                    disabled={isClearing}
                  >
                    AI Responses
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearSpecificCaches('bookmark')}
                    disabled={isClearing}
                  >
                    Bookmarks
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearSpecificCaches('summary')}
                    disabled={isClearing}
                  >
                    Summaries
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearSpecificCaches('streaming')}
                    disabled={isClearing}
                  >
                    Streaming
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={refreshStats} 
          disabled={isLoading || isClearing}
        >
          Refresh
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={clearAllCaches}
          disabled={isLoading || isClearing}
        >
          Clear All Caches
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CacheManager;
