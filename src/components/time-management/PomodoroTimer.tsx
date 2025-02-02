import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Coffee, Pause, Play, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => {
          if (timeLeft === 0) {
            clearInterval(interval);
            handleSessionComplete();
            return isBreak ? 25 * 60 : 5 * 60;
          }
          if (!isBreak) {
            setTotalWorkTime(prev => prev + 1);
          }
          return timeLeft - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, isBreak]);

  const handleSessionComplete = () => {
    const audio = new Audio("/notification.mp3");
    audio.play();
    
    if (!isBreak) {
      setSessionsCompleted(sessionsCompleted + 1);
      toast({
        title: "Pomodoro Complete!",
        description: "Time for a break!",
      });
    } else {
      toast({
        title: "Break Complete!",
        description: "Ready to start another session?",
      });
    }
    
    setIsBreak(!isBreak);
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(25 * 60);
    setIsBreak(false);
  };

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-sm font-medium">
          {isBreak ? "Break Time" : "Focus Time"}
        </h3>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Sessions completed: {sessionsCompleted}</p>
          <p>Total work time: {formatTotalTime(totalWorkTime)}</p>
        </div>
      </div>

      <div className="flex justify-center">
        <span className="text-2xl font-medium tabular-nums">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="flex justify-center gap-2">
        <Button 
          onClick={toggleTimer}
          size="sm"
          variant="outline"
          className="h-8 px-3"
        >
          {!isActive || isPaused ? (
            <>
              <Play className="h-3.5 w-3.5 mr-1" />
              {!isActive ? "Start" : "Resume"}
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5 mr-1" />
              Pause
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={resetTimer}
          size="sm"
          className="h-8 px-3"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      </div>

      {isBreak && (
        <div className="flex justify-center">
          <Coffee className="text-muted-foreground animate-bounce h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;