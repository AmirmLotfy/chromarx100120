
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useStreamProcessing } from '@/hooks/useStreamProcessing';
import { RotateCw, PlayCircle, ArrowUpDown, CloudOff, AlertTriangle } from 'lucide-react';

const ChromeBackgroundProcessing = () => {
  const [items, setItems] = useState<string[]>([]);
  
  const {
    isProcessing,
    progress,
    stepLabel,
    processed,
    total,
    cancelProcessing,
    backgroundTasks,
    refreshBackgroundTasks,
    scheduleBackgroundTask,
    triggerBackgroundProcessing,
    processItems
  } = useStreamProcessing<string>();
  
  // Generate some dummy items for processing
  useEffect(() => {
    const dummyItems = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
    setItems(dummyItems);
  }, []);
  
  // Refresh background tasks when component mounts
  useEffect(() => {
    refreshBackgroundTasks();
    
    // Set up interval to refresh tasks
    const interval = setInterval(() => {
      refreshBackgroundTasks();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refreshBackgroundTasks]);
  
  const handleProcessInForeground = async () => {
    try {
      await processItems({
        items,
        processInBackground: false,
        processingCallback: async (item, index) => {
          console.log(`Processing ${item} (${index + 1}/${items.length})`);
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 200));
          return `Processed: ${item}`;
        },
        onComplete: (results) => {
          toast.success("Foreground processing completed!");
        },
        onError: (error, item) => {
          toast.error(`Error processing ${item}: ${error.message}`);
        },
        stepLabels: ["Starting process", "Processing items", "Finalizing results"]
      });
    } catch (error) {
      console.error('Processing error:', error);
    }
  };
  
  const handleProcessInBackground = async () => {
    try {
      const taskId = await processItems({
        items,
        processInBackground: true,
        processingCallback: async (item, index) => {
          console.log(`Background processing ${item} (${index + 1}/${items.length})`);
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 200));
          return `Processed: ${item}`;
        },
        onComplete: (results) => {
          toast.success("Background processing completed!");
        },
        onError: (error, item) => {
          toast.error(`Error processing ${item}: ${error.message}`);
        },
        stepLabels: ["Starting background process", "Processing items", "Finalizing results"]
      });
      
      if (taskId) {
        toast.success(`Task scheduled: ${taskId}`);
      }
    } catch (error) {
      console.error('Background processing error:', error);
    }
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
    } else {
      toast.error("Failed to schedule task");
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'processing': return 'secondary';
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      default: return 'default';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Stream Processing
          </CardTitle>
          <CardDescription>
            Process bookmark data efficiently with streams in foreground or background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{stepLabel || 'Processing...'}</span>
                <span>{processed} of {total} ({progress}%)</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button 
              onClick={handleProcessInForeground}
              disabled={isProcessing}
              className="flex-1"
              variant="default"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Process in Foreground
            </Button>
            
            <Button 
              onClick={handleProcessInBackground}
              disabled={isProcessing} 
              variant="secondary"
              className="flex-1"
            >
              <CloudOff className="mr-2 h-4 w-4" />
              Process in Background
            </Button>
            
            {isProcessing && (
              <Button 
                onClick={cancelProcessing}
                variant="destructive"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Cancel Processing
              </Button>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground mt-4">
            <p>
              Stream processing uses the modern Streams API for efficient data handling.
              Background processing leverages Chrome's service worker capabilities.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Background Tasks
          </CardTitle>
          <CardDescription>
            Schedule and manage background tasks that run in the service worker
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
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <div className="bg-secondary/20 p-3 font-medium text-sm">
              Tasks ({backgroundTasks.length})
            </div>
            <div className="divide-y max-h-48 overflow-y-auto">
              {backgroundTasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No background tasks found
                </div>
              ) : (
                backgroundTasks.map(task => (
                  <div key={task.id} className="p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{task.type}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.data?.message || 'No message'}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Added: {new Date(task.added).toLocaleString()}
                    </div>
                    {task.status === 'processing' && task.progress > 0 && (
                      <Progress value={task.progress} className="h-1 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground flex flex-col items-start">
          <p>Background tasks continue to run even when the extension UI is closed</p>
          <p className="mt-1">Efficient task processing is achieved through Chrome's service worker architecture</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChromeBackgroundProcessing;
