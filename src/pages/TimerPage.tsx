import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { TimerControls } from "@/components/timer/TimerControls";
import { TimerSuggestions } from "@/components/timer/TimerSuggestions";
import { TimerSettings } from "@/components/timer/TimerSettings";
import { useToast } from "@/hooks/use-toast";
import { getGeminiResponse } from "@/utils/geminiUtils";

const TimerPage = () => {
  const [duration, setDuration] = useState(25); // Default 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const { toast } = useToast();

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
    
    // Play notification sound
    const audio = new Audio('/notification.mp3');
    await audio.play();

    // Show Chrome notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: `Your ${mode} session is complete!`,
        icon: '/icon128.png',
        silent: true // We're playing our own sound
      });
    }

    toast({
      title: "Timer Complete!",
      description: `Your ${mode} session is complete!`,
    });
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

        <TimerDisplay 
          timeLeft={timeLeft}
          mode={mode}
        />

        <TimerControls
          isRunning={isRunning}
          onStart={() => setIsRunning(true)}
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