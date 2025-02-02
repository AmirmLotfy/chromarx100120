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
      <div className="flex items-center justify-center space-x-3">
        <Input
          type="number"
          value={minutes}
          onChange={handleMinutesChange}
          className="w-20 h-10 text-lg text-center"
          min="0"
          disabled={isActive}
        />
        <span className="text-2xl font-medium">:</span>
        <span className="text-2xl font-medium w-16 text-center">
          {seconds.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="flex justify-center space-x-3">
        {!isActive ? (
          <Button 
            onClick={startTimer}
            size="default"
            className="h-10"
          >
            <Play className="mr-1.5 h-4 w-4" />
            Start
          </Button>
        ) : isPaused ? (
          <Button 
            onClick={resumeTimer}
            size="default"
            className="h-10"
          >
            <Play className="mr-1.5 h-4 w-4" />
            Resume
          </Button>
        ) : (
          <Button 
            onClick={pauseTimer}
            size="default"
            className="h-10"
          >
            <Pause className="mr-1.5 h-4 w-4" />
            Pause
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={resetTimer}
          size="default"
          className="h-10"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
};

export default CustomTimer;
