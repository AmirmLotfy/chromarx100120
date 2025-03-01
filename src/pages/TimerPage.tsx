
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { TimerControls } from "@/components/timer/TimerControls";
import { TimerSuggestions } from "@/components/timer/TimerSuggestions";
import { TimerSettings } from "@/components/timer/TimerSettings";
import { useToast } from "@/hooks/use-toast";
import { timerService } from "@/services/timerService";
import { TimerSession } from "@/types/timer";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import ProductivityScore from "@/components/analytics/ProductivityScore";
import { Clock, CheckCircle2, BarChart3, Zap } from "lucide-react";

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

    // Play completion sound
    timerService.playCompletionSound();
    
    // Show notification
    toast({
      title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} session complete!`,
      description: "Time to take a break or start a new session.",
    });

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
      
      toast({
        title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} timer started`,
        description: `${duration} minute session started.`,
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <Layout>
      <motion.div 
        className="container mx-auto px-4 py-4 space-y-6 max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-center">Focus Timer</h1>
          <Input
            placeholder="What are you working on?"
            value={taskContext}
            onChange={(e) => setTaskContext(e.target.value)}
            className="bg-background/50 backdrop-blur-sm border-muted text-center"
          />
        </motion.div>

        {stats && (
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-3"
          >
            <Card className="p-3 bg-background/50 backdrop-blur-sm border-muted/50 flex flex-col items-center">
              <Clock className="w-4 h-4 text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Total Focus</p>
              <p className="text-lg font-bold">{Math.round(stats.totalFocusTime / 60)}h</p>
            </Card>
            <Card className="p-3 bg-background/50 backdrop-blur-sm border-muted/50 flex flex-col items-center">
              <CheckCircle2 className="w-4 h-4 text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="text-lg font-bold">{stats.totalSessions}</p>
            </Card>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <TimerDisplay 
            timeLeft={timeLeft}
            mode={mode}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TimerControls
            isRunning={isRunning}
            onStart={handleStart}
            onPause={() => setIsRunning(false)}
            onReset={() => {
              setIsRunning(false);
              setTimeLeft(duration * 60);
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TimerSuggestions
            onSelectDuration={(mins) => {
              setDuration(mins);
              setTimeLeft(mins * 60);
            }}
            taskContext={taskContext}
            mode={mode}
          />
        </motion.div>

        {stats && (
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mt-2">
            <ProductivityScore score={Math.round(stats.averageProductivity)} />
            <Card className="p-3 bg-background/50 backdrop-blur-sm border-muted/50 flex flex-col items-center h-full justify-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
              <p className="text-2xl font-bold">{Math.round(stats.completionRate)}%</p>
              <p className="text-xs text-muted-foreground">of sessions finished</p>
            </Card>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <TimerSettings
            duration={duration}
            mode={mode}
            onDurationChange={(newDuration) => {
              setDuration(newDuration);
              setTimeLeft(newDuration * 60);
            }}
            onModeChange={setMode}
          />
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default TimerPage;
