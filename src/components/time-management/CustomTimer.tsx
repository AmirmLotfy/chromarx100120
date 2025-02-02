import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timer, Pause, Play, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomTimerProps {
  initialMinutes?: number | null;
  onComplete?: () => void;
}

const CustomTimer = ({ initialMinutes, onComplete }: CustomTimerProps) => {
  const [minutes, setMinutes] = useState(initialMinutes || 25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(interval);
            setIsActive(false);
            playNotification();
            onComplete?.();
            return;
          }
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, minutes, seconds, onComplete]);

  const playNotification = () => {
    const audio = new Audio("/notification.mp3");
    audio.play();
    toast({
      title: "Timer Complete!",
      description: "Your timer session has ended.",
    });
  };

  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setMinutes(initialMinutes || 25);
    setSeconds(0);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setMinutes(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        <Input
          type="number"
          value={minutes}
          onChange={handleMinutesChange}
          className="w-16 h-8 text-sm text-center"
          min="0"
          disabled={isActive}
        />
        <span className="text-xl font-medium">:</span>
        <span className="text-xl font-medium w-12 text-center tabular-nums">
          {seconds.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="flex justify-center gap-2">
        {!isActive ? (
          <Button 
            onClick={startTimer}
            size="sm"
            variant="outline"
            className="h-8 px-3"
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Start
          </Button>
        ) : isPaused ? (
          <Button 
            onClick={resumeTimer}
            size="sm"
            variant="outline"
            className="h-8 px-3"
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Resume
          </Button>
        ) : (
          <Button 
            onClick={pauseTimer}
            size="sm"
            variant="outline"
            className="h-8 px-3"
          >
            <Pause className="h-3.5 w-3.5 mr-1" />
            Pause
          </Button>
        )}
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
    </div>
  );
};

export default CustomTimer;