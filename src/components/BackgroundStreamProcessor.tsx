
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { processWithStreams } from "@/utils/webStreamUtils";

export function BackgroundStreamProcessor() {
  const [tasks, setTasks] = useState<Array<{
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: any;
    error?: string;
  }>>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Create a new processing task
  const createTask = () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      value: Math.random() * 100
    }));

    const taskId = `task_${Date.now()}`;
    
    setTasks(prev => [
      ...prev,
      {
        id: taskId,
        name: `Data Processing Task ${prev.length + 1}`,
        status: 'pending',
        progress: 0
      }
    ]);
    
    // Auto-select the new task
    setSelectedTask(taskId);
    
    toast.success("New processing task created");
  };

  // Process a specific task
  const processTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'processing') return;
    
    // Create items to process
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      value: Math.random() * 100
    }));
    
    // Update task status
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'processing' as const, progress: 0 } : t
    ));
    
    // Create abort controller
    const controller = new AbortController();
    setAbortController(controller);
    setIsProcessing(true);
    
    try {
      // Process the items using streams
      const results = await processWithStreams(
        items,
        async (item) => {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 50));
          return {
            id: item.id,
            result: Math.sqrt(item.value).toFixed(2)
          };
        },
        {
          onProgress: (processed, total, percentage) => {
            // Update task progress
            setTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, progress: percentage } : t
            ));
          },
          signal: controller.signal
        }
      );
      
      // Update task with results
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: 'completed' as const, 
          progress: 100,
          result: results
        } : t
      ));
      
      toast.success(`Task ${task.name} completed successfully`);
    } catch (error) {
      console.error("Processing error:", error);
      
      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'failed' as const, error: 'Task was cancelled' } : t
        ));
        toast.info(`Task ${task.name} was cancelled`);
      } else {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { 
            ...t, 
            status: 'failed' as const, 
            error: error instanceof Error ? error.message : 'Unknown error'
          } : t
        ));
        toast.error(`Task ${task.name} failed`);
      }
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  };

  // Cancel the current processing task
  const cancelProcessing = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsProcessing(false);
    }
  };

  // Clear all tasks
  const clearTasks = () => {
    if (isProcessing) {
      toast.error("Cannot clear tasks while processing is active");
      return;
    }
    
    setTasks([]);
    setSelectedTask(null);
    toast.success("All tasks cleared");
  };

  // Get the status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Background Stream Processor</CardTitle>
        <CardDescription>
          Process data efficiently using Web Streams API
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Button onClick={createTask}>Create Task</Button>
          
          <div className="space-x-2">
            {selectedTask && (
              <>
                <Button 
                  variant="default" 
                  onClick={() => processTask(selectedTask)}
                  disabled={isProcessing || tasks.find(t => t.id === selectedTask)?.status === 'processing'}
                >
                  Process Selected
                </Button>
                
                {isProcessing && (
                  <Button variant="destructive" onClick={cancelProcessing}>
                    Cancel
                  </Button>
                )}
              </>
            )}
            
            <Button variant="outline" onClick={clearTasks} disabled={isProcessing}>
              Clear All
            </Button>
          </div>
        </div>
        
        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-md md:col-span-1 overflow-hidden">
              <div className="bg-muted p-2 font-medium">
                Tasks ({tasks.length})
              </div>
              <div className="max-h-80 overflow-y-auto">
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    className={`p-3 border-b cursor-pointer transition-colors ${
                      selectedTask === task.id ? 'bg-muted/50' : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedTask(task.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{task.name}</span>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                    {task.status === 'processing' && (
                      <Progress value={task.progress} className="h-1 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border rounded-md md:col-span-3 overflow-hidden">
              {selectedTask ? (
                <div>
                  <div className="bg-muted p-2 font-medium">
                    Task Details
                  </div>
                  <div className="p-4">
                    {(() => {
                      const task = tasks.find(t => t.id === selectedTask);
                      if (!task) return <div>Select a task to view details</div>;
                      
                      return (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold">{task.name}</h3>
                            <div className="flex items-center mt-1 text-sm">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge className="ml-2" variant={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                          
                          {task.status === 'processing' && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress:</span>
                                <span>{task.progress}%</span>
                              </div>
                              <Progress value={task.progress} />
                            </div>
                          )}
                          
                          {task.error && (
                            <div className="text-sm text-destructive border border-destructive/20 bg-destructive/10 p-2 rounded">
                              Error: {task.error}
                            </div>
                          )}
                          
                          {task.status === 'completed' && task.result && (
                            <Tabs defaultValue="summary">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="summary">Summary</TabsTrigger>
                                <TabsTrigger value="data">Data</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="summary" className="space-y-2 mt-2">
                                <div className="text-sm">
                                  <p>Processed {task.result.length} items successfully</p>
                                  <p>Completed in {(task.result.length * 50) / 1000} seconds</p>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="data" className="mt-2">
                                <div className="max-h-60 overflow-y-auto border rounded p-2 text-sm">
                                  {task.result.slice(0, 20).map((item: any) => (
                                    <div key={item.id} className="py-1 border-b last:border-0">
                                      Item {item.id}: {item.result}
                                    </div>
                                  ))}
                                  {task.result.length > 20 && (
                                    <div className="py-1 text-muted-foreground italic">
                                      ...and {task.result.length - 20} more items
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                          
                          <div className="flex justify-end space-x-2 pt-2">
                            {task.status === 'pending' && (
                              <Button 
                                onClick={() => processTask(task.id)} 
                                disabled={isProcessing}
                              >
                                Process
                              </Button>
                            )}
                            
                            {task.status === 'processing' && (
                              <Button 
                                variant="destructive" 
                                onClick={cancelProcessing}
                              >
                                Cancel
                              </Button>
                            )}
                            
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setTasks(prev => prev.filter(t => t.id !== task.id));
                                setSelectedTask(null);
                              }}
                              disabled={task.status === 'processing'}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Select a task from the list to view details
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            No stream processing tasks created yet.
            <div className="mt-2">
              <Button onClick={createTask}>Create Your First Task</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BackgroundStreamProcessor;
