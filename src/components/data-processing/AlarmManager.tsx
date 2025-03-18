
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { 
  getAllAlarms, 
  clearAlarm, 
  scheduleTask, 
  parseAlarmData,
  scheduleBookmarkSync,
  scheduleCacheCleanup
} from '@/utils/chromeAlarmUtils';
import { toast } from 'sonner';

interface AlarmDetails {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number;
  data?: any;
}

export function AlarmManager() {
  const [alarms, setAlarms] = useState<AlarmDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmDetails | null>(null);
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  
  // New alarm form state
  const [newAlarmType, setNewAlarmType] = useState<string>('SYNC_BOOKMARKS');
  const [newAlarmDelay, setNewAlarmDelay] = useState<number>(5);
  const [newAlarmPeriodic, setNewAlarmPeriodic] = useState<boolean>(false);
  const [newAlarmPeriod, setNewAlarmPeriod] = useState<number>(24);
  
  // Load alarms
  const loadAlarms = async () => {
    setIsLoading(true);
    try {
      if (typeof chrome === 'undefined' || !chrome.alarms) {
        setAlarms([]);
        toast.error('Chrome alarms API not available');
        return;
      }
      
      const allAlarms = await getAllAlarms();
      
      const alarmDetails: AlarmDetails[] = allAlarms.map(alarm => {
        const data = parseAlarmData(alarm.name);
        
        return {
          name: alarm.name,
          scheduledTime: alarm.scheduledTime || 0,
          periodInMinutes: alarm.periodInMinutes,
          data
        };
      });
      
      setAlarms(alarmDetails);
    } catch (error) {
      console.error('Error loading alarms:', error);
      toast.error('Failed to load alarms');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load alarms on mount
  useEffect(() => {
    loadAlarms();
    
    // Set up a refresh interval
    const intervalId = setInterval(loadAlarms, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Cancel an alarm
  const handleCancelAlarm = async (name: string) => {
    try {
      const success = await clearAlarm(name);
      
      if (success) {
        toast.success('Alarm cancelled successfully');
        loadAlarms();
      } else {
        toast.error('Failed to cancel alarm');
      }
    } catch (error) {
      console.error('Error cancelling alarm:', error);
      toast.error('Failed to cancel alarm');
    }
  };
  
  // View alarm details
  const handleViewAlarmDetails = (alarm: AlarmDetails) => {
    setSelectedAlarm(alarm);
    setIsOpenDialog(true);
  };
  
  // Create a new alarm
  const handleCreateAlarm = async () => {
    try {
      let task;
      const delayMs = newAlarmDelay * 60000; // Convert minutes to ms
      
      switch (newAlarmType) {
        case 'SYNC_BOOKMARKS':
          task = await scheduleBookmarkSync({
            fullSync: true,
            delay: delayMs,
            periodic: newAlarmPeriodic,
            periodInHours: newAlarmPeriod
          });
          break;
          
        case 'CLEANUP':
          task = await scheduleCacheCleanup({
            delay: delayMs,
            periodic: newAlarmPeriodic,
            periodInDays: newAlarmPeriod / 24 // Convert hours to days
          });
          break;
          
        case 'CUSTOM_TASK':
          task = await scheduleTask('CUSTOM_TASK', {
            timestamp: Date.now()
          }, {
            delay: delayMs,
            period: newAlarmPeriodic ? newAlarmPeriod * 60 * 60 * 1000 : undefined // Convert hours to ms
          });
          break;
          
        default:
          toast.error('Invalid alarm type');
          return;
      }
      
      if (task) {
        toast.success('Alarm scheduled successfully');
        loadAlarms();
      } else {
        toast.error('Failed to schedule alarm');
      }
    } catch (error) {
      console.error('Error creating alarm:', error);
      toast.error('Failed to create alarm');
    }
  };
  
  // Format date and time
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get time remaining until alarm fires
  const getTimeRemaining = (scheduledTime: number) => {
    const now = Date.now();
    const remaining = scheduledTime - now;
    
    if (remaining <= 0) {
      return 'Due now';
    }
    
    const minutes = Math.floor(remaining / 60000);
    
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hr${remainingHours !== 1 ? 's' : ''}`;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Scheduled Tasks</CardTitle>
        <CardDescription>
          Manage chrome.alarms for background processing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Create New Task</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-type">Task Type</Label>
                <Select 
                  value={newAlarmType} 
                  onValueChange={setNewAlarmType}
                >
                  <SelectTrigger id="task-type">
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYNC_BOOKMARKS">Sync Bookmarks</SelectItem>
                    <SelectItem value="CLEANUP">Cache Cleanup</SelectItem>
                    <SelectItem value="CUSTOM_TASK">Custom Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-delay">Delay (minutes)</Label>
                <Input 
                  id="task-delay"
                  type="number"
                  min="1"
                  value={newAlarmDelay}
                  onChange={(e) => setNewAlarmDelay(parseInt(e.target.value) || 5)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="task-periodic"
                checked={newAlarmPeriodic}
                onChange={(e) => setNewAlarmPeriodic(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="task-periodic">Recurring Task</Label>
            </div>
            
            {newAlarmPeriodic && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="task-period">Period (hours)</Label>
                <Input 
                  id="task-period"
                  type="number"
                  min="1"
                  value={newAlarmPeriod}
                  onChange={(e) => setNewAlarmPeriod(parseInt(e.target.value) || 24)}
                />
              </div>
            )}
            
            <Button 
              onClick={handleCreateAlarm} 
              className="mt-2"
            >
              Schedule Task
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Active Tasks ({alarms.length})</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadAlarms}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading tasks...
              </div>
            ) : alarms.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground border rounded-md">
                No scheduled tasks found
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                {alarms.map((alarm, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded hover:bg-muted">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {alarm.data?.type || 'Unknown Task'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Scheduled: {formatDateTime(alarm.scheduledTime)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {getTimeRemaining(alarm.scheduledTime)}
                        </Badge>
                        {alarm.periodInMinutes && (
                          <Badge variant="secondary" className="text-xs">
                            Repeats every {alarm.periodInMinutes >= 60 
                              ? `${Math.floor(alarm.periodInMinutes / 60)} hr(s)` 
                              : `${alarm.periodInMinutes} min(s)`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewAlarmDetails(alarm)}
                      >
                        Details
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleCancelAlarm(alarm.name)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={loadAlarms}>
          Refresh All
        </Button>
      </CardFooter>
      
      {/* Alarm Details Dialog */}
      <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              Details about the scheduled task
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlarm && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <div className="font-medium">Type:</div>
                <div>{selectedAlarm.data?.type || 'Unknown'}</div>
                
                <div className="font-medium">Scheduled:</div>
                <div>{formatDateTime(selectedAlarm.scheduledTime)}</div>
                
                <div className="font-medium">Remaining:</div>
                <div>{getTimeRemaining(selectedAlarm.scheduledTime)}</div>
                
                {selectedAlarm.periodInMinutes && (
                  <>
                    <div className="font-medium">Repeats:</div>
                    <div>
                      Every {selectedAlarm.periodInMinutes >= 60 
                        ? `${Math.floor(selectedAlarm.periodInMinutes / 60)} hour(s)` 
                        : `${selectedAlarm.periodInMinutes} minute(s)`}
                    </div>
                  </>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="font-medium">Raw Data:</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(selectedAlarm.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="destructive" onClick={() => selectedAlarm && handleCancelAlarm(selectedAlarm.name)}>
              Cancel Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default AlarmManager;
