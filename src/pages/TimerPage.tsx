
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { TimerControls } from "@/components/timer/TimerControls";
import { TimerSuggestions } from "@/components/timer/TimerSuggestions";
import { TimerSettings } from "@/components/timer/TimerSettings";
import { useToast } from "@/hooks/use-toast";
import { timerService } from "@/services/timerService";
import { TimerSession, TimerStats } from "@/types/timer";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2, Clock, BarChart4, History } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const TimerPage = () => {
  const [duration, setDuration] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [taskContext, setTaskContext] = useState<string>("focus and productivity");
  const [currentSession, setCurrentSession] = useState<TimerSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Update timeLeft when duration changes
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration * 60);
    }
  }, [duration, isRunning]);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['timerStats'],
    queryFn: () => timerService.getStats(),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      onError: (error: Error) => {
        console.error("Failed to fetch timer stats:", error);
        toast({
          title: "Error loading stats",
          description: "We couldn't load your productivity stats.",
          variant: "destructive",
        });
      }
    }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    try {
      if (currentSession) {
        await timerService.completeSession(
          currentSession.id,
          mode === 'focus' ? calculateProductivityScore() : undefined
        );
      }

      // Automatically switch modes and suggest new duration
      setMode(prevMode => prevMode === "focus" ? "break" : "focus");
      
      toast({
        title: "Time's up!",
        description: `Your ${mode} session is complete.`,
      });
    } catch (error) {
      console.error("Error completing timer session:", error);
      toast({
        title: "Error",
        description: "Failed to complete timer session",
        variant: "destructive"
      });
    }
  };

  const handleStart = async () => {
    try {
      const session = await timerService.startSession({
        duration: duration * 60,
        mode,
        startTime: new Date(),
        taskContext,
        aiSuggested: false
      });
      
      setCurrentSession(session);
      setIsRunning(true);
      toast({
        title: "Timer Started",
        description: `${duration} minute ${mode} session has begun.`,
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      toast({
        title: "Error",
        description: "Failed to start timer session",
        variant: "destructive"
      });
    }
  };

  const calculateProductivityScore = (): number => {
    if (!currentSession) return 0;
    const completionRatio = (duration * 60 - timeLeft) / (duration * 60);
    return Math.round(completionRatio * 100);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive notifications when timers complete.",
        });
      }
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (statsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your focus data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (statsError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 space-y-6 max-w-md">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Focus Timer</h1>
            <p className="text-destructive">
              There was an error loading your timer data.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-full shadow-md hover:shadow-lg transition-all mt-4"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-8 max-w-md">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Focus Timer
          </h1>
          <p className="text-muted-foreground text-sm">
            Enhance your productivity with smart focus sessions
          </p>
        </div>

        <div className="relative">
          <TimerDisplay 
            timeLeft={timeLeft}
            mode={mode}
            maxTime={duration * 60}
          />
        </div>

        <TimerControls
          isRunning={isRunning}
          onStart={handleStart}
          onPause={() => setIsRunning(false)}
          onReset={() => {
            setIsRunning(false);
            setTimeLeft(duration * 60);
          }}
        />

        <div className="py-4">
          <TimerSuggestions
            onSelectDuration={(mins) => {
              setDuration(mins);
              setTimeLeft(mins * 60);
            }}
            taskContext={taskContext}
            mode={mode}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card 
            className={`p-4 transition-all duration-300 transform ${
              showSettings ? 'scale-100 opacity-100' : 'scale-95 opacity-90'
            }`}
          >
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Timer Settings</h3>
              </div>
              <div className={`transform transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </button>
            
            {showSettings && (
              <div className="pt-2 animate-fade-in">
                <TimerSettings
                  duration={duration}
                  mode={mode}
                  onDurationChange={(newDuration) => {
                    setDuration(newDuration);
                    setTimeLeft(newDuration * 60);
                  }}
                  onModeChange={setMode}
                />
              </div>
            )}
          </Card>
        </div>

        {stats && (
          <Card className="p-4 bg-gradient-to-br from-background to-accent/30 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BarChart4 className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Your Focus Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Focus Time</p>
                <p className="text-xl font-bold">{Math.round(stats.totalFocusTime / 60)}h</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="text-xl font-bold">{stats.totalSessions}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Productivity</p>
                <p className="text-xl font-bold">{Math.round(stats.averageProductivity)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Completion</p>
                <p className="text-xl font-bold">{Math.round(stats.completionRate)}%</p>
              </div>
            </div>
          </Card>
        )}

        <div className="h-12"></div> {/* Bottom spacing for mobile */}
      </div>
    </Layout>
  );
};

export default TimerPage;
