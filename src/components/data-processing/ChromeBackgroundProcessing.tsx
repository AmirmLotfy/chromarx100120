
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useBackgroundProcessing } from "@/hooks/useBackgroundProcessing";

const ChromeBackgroundProcessing = () => {
  const [items, setItems] = useState<string[]>([]);
  
  const {
    processItems,
    isProcessing,
    progress,
    cancelProcessing,
    backgroundTasks,
    refreshBackgroundTasks,
    scheduleBackgroundTask,
    triggerBackgroundProcessing
  } = useBackgroundProcessing<string>();
  
  // Generate some dummy items for processing
  useEffect(() => {
    const dummyItems = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
    setItems(dummyItems);
  }, []);
  
  // Refresh background tasks when component mounts
  useEffect(() => {
    refreshBackgroundTasks();
  }, [refreshBackgroundTasks]);
  
  const handleProcessInForeground = async () => {
    await processItems({
      items,
      processInBackground: false,
      processingCallback: async (item, index) => {
        console.log(`Processing ${item} (${index + 1}/${items.length})`);
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 200));
      },
      onComplete: () => {
        toast.success("Foreground processing completed!");
      },
      onError: (error, item) => {
        toast.error(`Error processing ${item}: ${error.message}`);
      },
      stepLabels: ["Starting", "Processing", "Finalizing"]
    });
  };
  
  const handleProcessInBackground = async () => {
    await processItems({
      items,
      processInBackground: true,
      processingCallback: async (item, index) => {
        console.log(`Background processing ${item} (${index + 1}/${items.length})`);
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 200));
      },
      onComplete: () => {
        toast.success("Background processing completed!");
      },
      onError: (error, item) => {
        toast.error(`Error processing ${item}: ${error.message}`);
      }
    });
  };
  
  const handleScheduleTask = async () => {
    const taskId = await scheduleBackgroundTask({
      type: 'CUSTOM_TASK',
      data: {
        message: 'This is a custom task',
        timestamp: Date.now()
      },
      priority: 'normal'
    });
    
    if (taskId) {
      toast.success("Task scheduled successfully");
      refreshBackgroundTasks();
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chrome Background Processing</CardTitle>
          <CardDescription>
            Process data in the foreground or background using service workers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button 
              onClick={handleProcessInForeground}
              disabled={isProcessing}
              className="flex-1"
            >
              Process in Foreground
            </Button>
            
            <Button 
              onClick={handleProcessInBackground}
              disabled={isProcessing} 
              variant="secondary"
              className="flex-1"
            >
              Process in Background
            </Button>
            
            {isProcessing && (
              <Button 
                onClick={cancelProcessing}
                variant="destructive"
              >
                Cancel Processing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Background Tasks</CardTitle>
          <CardDescription>
            Schedule and manage background tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={handleScheduleTask}>
              Schedule Custom Task
            </Button>
            
            <Button 
              onClick={triggerBackgroundProcessing}
              variant="secondary"
            >
              Process Pending Tasks
            </Button>
            
            <Button 
              onClick={refreshBackgroundTasks}
              variant="outline"
              size="icon"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            </Button>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <div className="bg-secondary/20 p-3 font-medium text-sm">
              Pending Tasks ({backgroundTasks.filter(t => t.status === 'pending').length})
            </div>
            <div className="divide-y max-h-48 overflow-y-auto">
              {backgroundTasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No background tasks found
                </div>
              ) : (
                backgroundTasks.map(task => (
                  <div key={task.id} className="p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{task.type}</span>
                      <Badge variant="outline">
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Added: {new Date(task.added).toLocaleString()}
                    </div>
                    {task.progress > 0 && (
                      <Progress value={task.progress} className="h-1 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Background tasks use Chrome's service worker to process data even when the extension UI is closed
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChromeBackgroundProcessing;
