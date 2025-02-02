import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface CustomTimerProps {
  initialMinutes: number;
  onComplete: () => void;
}

const CustomTimer = ({ initialMinutes, onComplete }: CustomTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(initialMinutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="space-y-4">
      <div className="text-4xl font-bold text-center">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      <div className="flex justify-center gap-2">
        <Button onClick={toggleTimer}>
          {isRunning ? "Pause" : "Start"}
        </Button>
        <Button variant="outline" onClick={resetTimer}>
          Reset
        </Button>
      </div>
    </div>
  );
};

export default CustomTimer;