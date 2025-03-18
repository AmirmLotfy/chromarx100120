
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useServiceWorker } from '@/hooks/useServiceWorker';

export function ServiceWorkerManager() {
  const [demoData, setDemoData] = useState<Array<{ id: number; name: string }>>([]);
  const [useHighPriority, setUseHighPriority] = useState(false);
  
  const {
    isActive,
    status,
    isLoading,
    pendingTasks,
    cacheInfo,
    scheduleTask,
    processTasks,
    refreshTasks,
    refreshCacheInfo,
    clearCache,
    unregister,
    update
  } = useServiceWorker({
    showToasts: true
  });
  
  // Generate random items for processing demo
  const generateDemoData = () => {
    const items = [];
    for (let i = 0; i < 20; i++) {
      items.push({
        id: i,
        name: `Item ${i + 1}`
      });
    }
    setDemoData(items);
  };
  
  // Schedule a demo data processing task
  const handleProcessData = async () => {
    if (demoData.length === 0) {
      generateDemoData();
      return;
    }
    
    await scheduleTask('DATA_PROCESSING', {
      items: demoData,
      batchSize: 5
    }, useHighPriority ? 'high' : 'normal');
  };
  
  // Schedule a cache cleanup task
  const handleScheduleCacheCleanup = async () => {
    await scheduleTask('CACHE_CLEANUP', {}, useHighPriority ? 'high' : 'normal');
  };
  
  // Get the task status badge variant
  const getTaskStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      case 'processing': return 'default';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Worker Manager</CardTitle>
          <CardDescription>
            Control and monitor the service worker that powers offline functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">
              Loading service worker status...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Status</h3>
                  <p className="text-sm text-muted-foreground">Service worker state</p>
                </div>
                <Badge variant={isActive ? 'success' : 'outline'}>
                  {status}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Background Tasks</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <Switch
                    id="high-priority"
                    checked={useHighPriority}
                    onCheckedChange={setUseHighPriority}
                  />
                  <Label htmlFor="high-priority">Use high priority</Label>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleProcessData}>
                    Process Data
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleScheduleCacheCleanup}>
                    Schedule Cache Cleanup
                  </Button>
                  <Button size="sm" variant="secondary" onClick={processTasks}>
                    Process Tasks
                  </Button>
                  <Button size="sm" variant="outline" onClick={refreshTasks}>
                    Refresh List
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted p-2">
                  <h4 className="text-sm font-medium">Pending Tasks ({pendingTasks.length})</h4>
                </div>
                <div className="divide-y max-h-64 overflow-y-auto">
                  {pendingTasks.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No background tasks found
                    </div>
                  ) : (
                    pendingTasks.map(task => (
                      <div key={task.id} className="p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{task.type}</span>
                          <Badge variant={getTaskStatusVariant(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ID: {task.id.substring(0, 8)}...
                          {task.createdAt && (
                            <span className="ml-2">
                              Created: {new Date(task.createdAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Cache Management</h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={clearCache}>
                    Clear Cache
                  </Button>
                  <Button size="sm" variant="outline" onClick={refreshCacheInfo}>
                    Refresh Cache Info
                  </Button>
                </div>
                
                {cacheInfo && (
                  <div className="text-sm mt-2">
                    <p>Total Caches: {cacheInfo.totalCaches}</p>
                    {cacheInfo.caches && (
                      <ul className="mt-1 space-y-1">
                        {cacheInfo.caches.map((cache: any) => (
                          <li key={cache.name} className="text-xs">
                            {cache.name}: {cache.entryCount} entries
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={update} disabled={!isActive}>
            Check for Updates
          </Button>
          <Button variant="destructive" onClick={unregister} disabled={!isActive}>
            Unregister Service Worker
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ServiceWorkerManager;
