import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TimerDisplay from '@/components/timer/TimerDisplay';
import TimerControls from '@/components/timer/TimerControls';
import TimerSettings from '@/components/timer/TimerSettings';
import TimerSuggestions from '@/components/timer/TimerSuggestions';
import { timerService } from '@/services/timerService';
import { TimerSession } from '@/types/timer';
import { useState as useZustand } from 'zustand';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { toast } from 'sonner';

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

  // Handle task context change
  const handleTaskContextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskContext(e.target.value);
  };

  // Rest of the component
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {mode === 'focus' ? 'Focus Timer' : 'Break Timer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <TimerDisplay 
                timeLeft={timeLeft} 
                mode={mode}
              />
              
              <TimerControls 
                isRunning={isRunning}
                onStart={startTimer}
                onPause={pauseTimer}
                onReset={resetTimer}
                onModeToggle={toggleMode}
                mode={mode}
              />
              
              <div className="w-full max-w-md mt-6">
                <label className="text-sm font-medium mb-2 block">
                  What are you working on? (optional)
                </label>
                <input
                  type="text"
                  value={taskContext}
                  onChange={handleTaskContextChange}
                  placeholder="e.g., Project research, Writing report..."
                  className="w-full p-2 border rounded-md"
                  disabled={isRunning}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Timer suggestions */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Suggested Duration</h3>
            <TimerSuggestions 
              onSelectDuration={(mins) => setDuration(mins * 60)}
              taskContext={taskContext}
              mode={mode}
            />
          </div>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Timer Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <TimerSettings 
                duration={duration}
                onDurationChange={(newDuration) => setDuration(newDuration)}
                mode={mode}
                disabled={isRunning}
              />
            </CardContent>
          </Card>
          
          {/* Stats Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="today">
                <TabsList className="w-full">
                  <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
                  <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
                  <TabsTrigger value="month" className="flex-1">This Month</TabsTrigger>
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
        </div>
      </div>
      
      {/* Feedback Dialog */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">How productive was your session?</h3>
            <div className="flex justify-between mb-6">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setProductivityRating(rating)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    productivityRating === rating 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Skip
              </button>
              <button
                onClick={submitFeedback}
                disabled={productivityRating === null}
                className={`px-4 py-2 rounded-md ${
                  productivityRating === null
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimerPage;
