
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { alarmManager } from '@/utils/alarmManager';
import { Clock, Trash2, RefreshCw } from 'lucide-react';

export function AlarmManager() {
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);
  const [taskType, setTaskType] = useState("BOOKMARK_SYNC");
  const [taskInterval, setTaskInterval] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load scheduled tasks
  const loadScheduledTasks = async () => {
    setIsLoading(true);
    try {
      const tasks = await alarmManager.getAllTasks();
      setScheduledTasks(tasks);
    } catch (error) {
      console.error('Error loading scheduled tasks:', error);
      toast.error('Failed to load scheduled tasks');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Schedule a recurring task
  const handleScheduleTask = async () => {
    try {
      const success = await alarmManager.scheduleRecurringTask(
        taskType,
        taskInterval,
        { description: `${taskType} task scheduled every ${taskInterval} minutes` }
      );
      
      if (success) {
        toast.success(`Scheduled ${taskType} task`);
        await loadScheduledTasks();
      } else {
        toast.error('Failed to schedule task');
      }
    } catch (error) {
      console.error('Error scheduling task:', error);
      toast.error('Error scheduling task');
    }
  };
  
  // Schedule background cleanup task
  const handleScheduleCleanup = async () => {
    try {
      const success = await alarmManager.scheduleOneTimeTask(
        'CLEANUP',
        2, // Run in 2 minutes
        { 
          targets: ['expired_data', 'temp_files', 'old_cache'],
          description: 'One-time cleanup of expired data' 
        }
      );
      
      if (success) {
        toast.success('Scheduled one-time cleanup task');
        await loadScheduledTasks();
      } else {
        toast.error('Failed to schedule cleanup');
      }
    } catch (error) {
      console.error('Error scheduling cleanup:', error);
      toast.error('Error scheduling cleanup');
    }
  };
  
  // Cancel a scheduled task
  const handleCancelTask = async (task: any) => {
    try {
      const success = await alarmManager.cancelTask(task.type);
      
      if (success) {
        toast.success(`Canceled ${task.type} task`);
        await loadScheduledTasks();
      } else {
        toast.error('Failed to cancel task');
      }
    } catch (error) {
      console.error('Error canceling task:', error);
      toast.error('Error canceling task');
    }
  };
  
  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Load tasks on component mount
  useEffect(() => {
    loadScheduledTasks();
    
    // Refresh tasks every 30 seconds
    const intervalId = setInterval(loadScheduledTasks, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Scheduled Tasks Manager
        </CardTitle>
        <CardDescription>
          Schedule recurring background tasks using chrome.alarms
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="task-type">Task Type</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger id="task-type">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOKMARK_SYNC">Bookmark Sync</SelectItem>
                  <SelectItem value="DATA_BACKUP">Data Backup</SelectItem>
                  <SelectItem value="NOTIFICATIONS_CHECK">Notifications Check</SelectItem>
                  <SelectItem value="STORAGE_CLEANUP">Storage Cleanup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task-interval">Interval (minutes)</Label>
              <Input
                id="task-interval"
                type="number"
                min={1}
                value={taskInterval}
                onChange={(e) => setTaskInterval(parseInt(e.target.value) || 30)}
              />
            </div>
            
            <Button onClick={handleScheduleTask}>
              Schedule Recurring Task
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleScheduleCleanup}>
              Schedule One-time Cleanup
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadScheduledTasks} 
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-medium mb-3">Scheduled Tasks ({scheduledTasks.length})</h3>
          
          {scheduledTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              No scheduled tasks found
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledTasks.map((task, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.type}</span>
                        <Badge variant={task.periodInMinutes ? 'secondary' : 'outline'}>
                          {task.periodInMinutes ? 'Recurring' : 'One-time'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-1">
                        {task.data?.description || 'No description'}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        {task.periodInMinutes ? (
                          <span>Runs every {task.periodInMinutes} minutes</span>
                        ) : (
                          <span>Runs once at {formatDate(task.scheduledTime)}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleCancelTask(task)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex-col items-start text-xs text-muted-foreground">
        <p>Tasks continue to run in the background even when the extension is closed</p>
        <p className="mt-1">Chrome allows alarms to run at minimum once per minute</p>
      </CardFooter>
    </Card>
  );
}

export default AlarmManager;
