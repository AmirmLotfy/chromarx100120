import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimerControls } from '@/components/timer/TimerControls';
import { TimerSettings } from '@/components/timer/TimerSettings';
import TimerSuggestions from '@/components/timer/TimerSuggestions';
import { timerService } from '@/services/timerService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlarmClock, Clock, BarChart4 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';

function TimerPage() {
  // Component states
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(25 * 60); // Default 25 minutes
  const [timeLeft, setTimeLeft] = useState(duration);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [productivityRating, setProductivityRating] = useState<number | null>(null);

  // Timer interval reference
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Reset timer when duration changes
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration);
    }
  }, [duration, isRunning]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Start timer
  const startTimer = async () => {
    if (timeLeft === 0) {
      setTimeLeft(duration);
    }

    try {
      // Create a new timer session in the database
      const session = await timerService.startSession({
        duration: duration,
        mode: mode,
        startTime: new Date(),
        taskContext: taskContext,
        aiSuggested: false,
      });

      setSessionId(session.id);
      setIsRunning(true);
      toast.success(`${mode.charAt(0).toUpperCase() + mode.slice(1)} timer started!`);
    } catch (error) {
      console.error('Failed to start timer session:', error);
      toast.error('Failed to start timer');
    }
  };

  // Pause timer
  const pauseTimer = () => {
    setIsRunning(false);
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    // We don't reset the sessionId here because we want to keep track of the session
  };

  // Complete timer
  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    if (sessionId) {
      try {
        await timerService.completeSession(sessionId);
        setShowFeedback(true);
      } catch (error) {
        console.error('Failed to complete timer session:', error);
      }
    }
    
    // Play sound and show notification
    timerService.playCompletionSound();
    timerService.showNotification();
    
    toast.success(`${mode.charAt(0).toUpperCase() + mode.slice(1)} session completed!`);
  };

  // Submit feedback
  const submitFeedback = async () => {
    if (sessionId && productivityRating !== null) {
      try {
        await timerService.provideFeedback(sessionId, productivityRating);
        setShowFeedback(false);
        setProductivityRating(null);
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      }
    }
  };

  // Switch between focus and break modes
  const toggleMode = () => {
    const newMode = mode === 'focus' ? 'break' : 'focus';
    setMode(newMode);
    
    // Set default durations based on mode
    if (newMode === 'focus') {
      setDuration(25 * 60); // 25 minutes for focus
    } else {
      setDuration(5 * 60); // 5 minutes for break
    }
    
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
    setIsRunning(false);
  };

  return (
    <Layout>
      <div className="px-4 py-6 max-w-md mx-auto">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <TimerDisplay 
              timeLeft={timeLeft} 
              mode={mode}
              maxTime={duration}
            />
            
            <TimerControls 
              isRunning={isRunning}
              onStart={startTimer}
              onPause={pauseTimer}
              onReset={resetTimer}
              onModeToggle={toggleMode}
              mode={mode}
            />
            
            <div className="mt-3 px-1">
              <label className="text-xs font-medium mb-1 block text-muted-foreground">
                What are you working on?
              </label>
              <Input
                type="text"
                value={taskContext}
                onChange={(e) => setTaskContext(e.target.value)}
                placeholder="e.g., Project research, Writing report..."
                className="w-full text-sm h-8"
                disabled={isRunning}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 space-y-6">
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-1">
                <BarChart4 className="h-4 w-4" />
                <span>Stats</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  <TimerSettings 
                    duration={duration}
                    onDurationChange={(newDuration) => setDuration(newDuration)}
                    mode={mode}
                    disabled={isRunning}
                  />
                </CardContent>
              </Card>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Suggested Duration</h3>
                <TimerSuggestions 
                  onSelectDuration={(mins) => setDuration(mins * 60)}
                  taskContext={taskContext}
                  mode={mode}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  <Tabs defaultValue="today" className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="today">Today</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="month">Month</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="today" className="space-y-4 mt-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Focus Sessions</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Focus Time</span>
                        <span className="font-medium">1h 15m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Completion Rate</span>
                        <span className="font-medium">85%</span>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="week" className="space-y-4 mt-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Focus Sessions</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Focus Time</span>
                        <span className="font-medium">6h 45m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Completion Rate</span>
                        <span className="font-medium">78%</span>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="month" className="space-y-4 mt-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Focus Sessions</span>
                        <span className="font-medium">42</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Focus Time</span>
                        <span className="font-medium">24h 30m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Completion Rate</span>
                        <span className="font-medium">82%</span>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Feedback Dialog */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-background p-6 rounded-lg max-w-xs w-full shadow-lg">
            <h3 className="text-lg font-medium mb-4">How productive was your session?</h3>
            <div className="flex justify-between mb-6">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setProductivityRating(rating)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    productivityRating === rating 
                      ? 'bg-primary text-white' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-4 py-2 border rounded-md hover:bg-muted/50"
              >
                Skip
              </button>
              <button
                onClick={submitFeedback}
                disabled={productivityRating === null}
                className={`px-4 py-2 rounded-md ${
                  productivityRating === null
                    ? 'bg-muted/50 cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default TimerPage;
