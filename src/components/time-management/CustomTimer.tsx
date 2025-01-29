import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Timer, Pause, Play, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CustomTimer = () => {
  const [minutes, setMinutes] = useState(25);
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
  }, [isActive, isPaused, minutes, seconds]);

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
    setMinutes(25);
    setSeconds(0);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setMinutes(value);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-center space-x-4">
          <Input
            type="number"
            value={minutes}
            onChange={handleMinutesChange}
            className="w-20 text-center"
            min="0"
            disabled={isActive}
          />
          <span className="text-2xl">:</span>
          <span className="text-2xl w-16 text-center">
            {seconds.toString().padStart(2, "0")}
          </span>
        </div>

        <div className="flex justify-center space-x-4">
          {!isActive ? (
            <Button onClick={startTimer}>
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : isPaused ? (
            <Button onClick={resumeTimer}>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button onClick={pauseTimer}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          <Button variant="outline" onClick={resetTimer}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CustomTimer;