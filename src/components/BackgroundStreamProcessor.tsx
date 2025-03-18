
/**
 * Background Stream Processor Component
 * Handles background processing tasks using the Streams API
 * Communicates with the service worker for processing large datasets
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, XCircle, Play, Pause, RotateCcw } from 'lucide-react';

interface BackgroundTask {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  added: number;
  priority?: 'high' | 'normal' | 'low';
  error?: string;
  data?: any;
}

export function BackgroundStreamProcessor() {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Load tasks from service worker
  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({ 
          type: "GET_TASKS"
        });
        
        if (response && response.success) {
          setTasks(response.tasks || []);
        }
      } else {
        // In development: simulate getting tasks
        console.log('In development mode: would get background tasks here');
        
        // Mock tasks for development
        setTasks([
          {
            id: 'task1',
            type: 'PROCESS_BOOKMARKS',
            status: 'pending',
            progress: 0,
            added: Date.now() - 60000,
            priority: 'normal',
            data: { count: 157 }
          },
          {
            id: 'task2',
            type: 'SYNC_BOOKMARKS',
            status: 'processing',
            progress: 45,
            added: Date.now() - 30000,
            priority: 'high',
            data: { source: 'chrome' }
          },
          {
            id: 'task3',
            type: 'ANALYZE_BOOKMARKS',
            status: 'completed',
            progress: 100,
            added: Date.now() - 120000,
            priority: 'normal',
            data: { bookmarkIds: ['id1', 'id2', 'id3'] }
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching background tasks:', error);
      toast.error('Could not fetch background tasks');
    } finally {
      setLoading(false);
    }
  };
  
  // Start processing pending tasks
  const startProcessing = async () => {
    try {
      setProcessing(true);
      
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({ 
          type: "PROCESS_TASKS"
        });
        
        if (response && response.success) {
          toast.success(`Processing ${response.taskCount} tasks`);
          await fetchTasks();
        }
      } else {
        // In development: simulate processing
        toast.success('Processing tasks (development mode)');
        
        // Simulate progress updates
        const pendingTasks = tasks.filter(t => t.status === 'pending');
        
        for (let i = 0; i < pendingTasks.length; i++) {
          const taskId = pendingTasks[i].id;
          
          setTasks(prev => prev.map(t => 
            t.id === taskId 
              ? { ...t, status: 'processing' } 
              : t
          ));
          
          // Simulate progress
          for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise(r => setTimeout(r, 200));
            
            setTasks(prev => prev.map(t => 
              t.id === taskId 
                ? { ...t, progress } 
                : t
            ));
          }
          
          // Mark as completed
          setTasks(prev => prev.map(t => 
            t.id === taskId 
              ? { ...t, status: 'completed', progress: 100 } 
              : t
          ));
          
          await new Promise(r => setTimeout(r, 500));
        }
      }
    } catch (error) {
      console.error('Error starting task processing:', error);
      toast.error('Failed to start processing tasks');
    } finally {
      setProcessing(false);
    }
  };
  
  // Cancel a specific task
  const cancelTask = async (taskId: string) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({ 
          type: "CANCEL_TASK",
          taskId
        });
        
        if (response && response.success) {
          toast.success('Task cancelled');
          await fetchTasks();
        }
      } else {
        // In development: simulate cancelling
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, status: 'failed', error: 'Cancelled by user' } 
            : t
        ));
        
        toast.info('Task cancelled (development mode)');
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error('Failed to cancel task');
    }
  };
  
  // Retry a failed task
  const retryTask = async (taskId: string) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({ 
          type: "RETRY_TASK",
          taskId
        });
        
        if (response && response.success) {
          toast.success('Task requeued');
          await fetchTasks();
        }
      } else {
        // In development: simulate retry
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, status: 'pending', progress: 0, error: undefined } 
            : t
        ));
        
        toast.info('Task requeued (development mode)');
      }
    } catch (error) {
      console.error('Error retrying task:', error);
      toast.error('Failed to retry task');
    }
  };
  
  // Clear completed tasks
  const clearCompletedTasks = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({ 
          type: "CLEAR_COMPLETED_TASKS"
        });
        
        if (response && response.success) {
          toast.success('Completed tasks cleared');
          await fetchTasks();
        }
      } else {
        // In development: simulate clearing
        setTasks(prev => prev.filter(t => t.status !== 'completed'));
        toast.info('Completed tasks cleared (development mode)');
      }
    } catch (error) {
      console.error('Error clearing completed tasks:', error);
      toast.error('Failed to clear completed tasks');
    }
  };
  
  // Listen for task updates from service worker
  useEffect(() => {
    const handleTaskUpdate = (message: any) => {
      if (message.type === 'TASK_UPDATED') {
        setTasks(prev => {
          const taskIndex = prev.findIndex(t => t.id === message.task.id);
          
          if (taskIndex >= 0) {
            const updatedTasks = [...prev];
            updatedTasks[taskIndex] = message.task;
            return updatedTasks;
          } else {
            return [...prev, message.task];
          }
        });
      } else if (message.type === 'TASK_ADDED') {
        setTasks(prev => [...prev, message.task]);
      }
    };
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleTaskUpdate);
    }
    
    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleTaskUpdate);
      }
    };
  }, []);
  
  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
    
    // Refresh tasks periodically
    const intervalId = setInterval(fetchTasks, 10000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Count tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const processingTasks = tasks.filter(t => t.status === 'processing').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const failedTasks = tasks.filter(t => t.status === 'failed').length;
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Background Processing</span>
          <div className="flex gap-2">
            <Badge variant="outline">{tasks.length} Tasks</Badge>
            {processingTasks > 0 && (
              <Badge variant="secondary" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Processing
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Stream-based background task processing system
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Badge variant="outline">{pendingTasks} Pending</Badge>
          <Badge variant="secondary">{processingTasks} Processing</Badge>
          <Badge variant="success">{completedTasks} Completed</Badge>
          <Badge variant="destructive">{failedTasks} Failed</Badge>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No background tasks in queue
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{task.type}</h4>
                    <p className="text-sm text-muted-foreground">
                      Added at {formatTime(task.added)}
                    </p>
                  </div>
                  
                  <Badge 
                    variant={
                      task.status === 'completed' ? 'success' : 
                      task.status === 'failed' ? 'destructive' :
                      task.status === 'processing' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {task.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {task.status === 'completed' && <Check className="h-3 w-3 mr-1" />}
                    {task.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                    {task.status}
                  </Badge>
                </div>
                
                {task.priority && (
                  <Badge variant="outline" className="mb-2">
                    Priority: {task.priority}
                  </Badge>
                )}
                
                <Progress 
                  value={task.progress} 
                  className={`h-2 mb-2 ${
                    task.status === 'completed' ? 'bg-green-100' : 
                    task.status === 'failed' ? 'bg-red-100' : ''
                  }`}
                />
                
                {task.error && (
                  <p className="text-sm text-destructive mt-1 mb-2">
                    Error: {task.error}
                  </p>
                )}
                
                <div className="flex gap-2 mt-2">
                  {task.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => startProcessing()}
                      disabled={processing}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Process
                    </Button>
                  )}
                  
                  {(task.status === 'pending' || task.status === 'processing') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => cancelTask(task.id)}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                  
                  {task.status === 'failed' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => retryTask(task.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={fetchTasks} disabled={loading}>
          <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <div className="flex gap-2">
          {completedTasks > 0 && (
            <Button variant="outline" onClick={clearCompletedTasks}>
              Clear Completed
            </Button>
          )}
          
          {pendingTasks > 0 && (
            <Button onClick={startProcessing} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Process Tasks
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
