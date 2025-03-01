
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
import { Loader2 } from "lucide-react";

const TimerPage = () => {
  const [duration, setDuration] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [taskContext, setTaskContext] = useState<string>("focus and productivity");
  const [currentSession, setCurrentSession] = useState<TimerSession | null>(null);
  const { toast } = useToast();

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
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading timer data...</span>
        </div>
      </Layout>
    );
  }

  if (statsError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 space-y-8 max-w-2xl">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Focus Timer</h1>
            <p className="text-destructive">
              There was an error loading your timer data. Please try again later.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md mt-4"
            >
              Reload
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-8 max-w-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Focus Timer</h1>
          <p className="text-muted-foreground">
            Enhance your productivity with AI-powered timer suggestions
          </p>
        </div>

        {stats && (
          <Card className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Focus Time</p>
              <p className="text-2xl font-bold">{Math.round(stats.totalFocusTime / 60)}h</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Sessions</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg. Productivity</p>
              <p className="text-2xl font-bold">{Math.round(stats.averageProductivity)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">{Math.round(stats.completionRate)}%</p>
            </div>
          </Card>
        )}

        <TimerDisplay 
          timeLeft={timeLeft}
          mode={mode}
          maxTime={duration * 60}
        />

        <TimerControls
          isRunning={isRunning}
          onStart={handleStart}
          onPause={() => setIsRunning(false)}
          onReset={() => {
            setIsRunning(false);
            setTimeLeft(duration * 60);
          }}
        />

        <TimerSuggestions
          onSelectDuration={(mins) => {
            setDuration(mins);
            setTimeLeft(mins * 60);
          }}
          taskContext={taskContext}
          mode={mode}
        />

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
    </Layout>
  );
};

export default TimerPage;
