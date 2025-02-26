
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { TimerControls } from "@/components/timer/TimerControls";
import { TimerSuggestions } from "@/components/timer/TimerSuggestions";
import { TimerSettings } from "@/components/timer/TimerSettings";
import { useToast } from "@/hooks/use-toast";
import { timerService } from "@/services/timerService";
import { getTimerSuggestion } from "@/utils/timerAI";
import { TimerSession, TimerStats } from "@/types/timer";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

const TimerPage = () => {
  const [duration, setDuration] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [taskContext, setTaskContext] = useState<string>("focus and productivity");
  const [currentSession, setCurrentSession] = useState<TimerSession | null>(null);
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ['timerStats'],
    queryFn: () => timerService.getStats(),
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
    
    if (currentSession) {
      await timerService.completeSession(
        currentSession.id,
        mode === 'focus' ? calculateProductivityScore() : undefined
      );
    }

    // Automatically switch modes and suggest new duration
    setMode(prevMode => prevMode === "focus" ? "break" : "focus");
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
