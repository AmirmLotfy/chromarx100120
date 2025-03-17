
import React from 'react';
import { cn } from "@/lib/utils";

export interface TimerDisplayProps {
  timeLeft: number;
  mode: "focus" | "break";
  maxTime?: number;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timeLeft, 
  mode,
  maxTime,
}) => {
  // Format the time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage if maxTime is provided
  const progressPercentage = maxTime ? (timeLeft / maxTime) * 100 : 100;

  return (
    <div className="flex flex-col items-center justify-center w-full py-8">
      <div 
        className={cn(
          "text-7xl font-mono font-bold",
          mode === "focus" ? "text-primary" : "text-amber-500"
        )}
      >
        {formatTime(timeLeft)}
      </div>
      
      {/* Radial progress indicator */}
      <div className="relative w-64 h-64 my-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="5"
            stroke="rgba(0,0,0,0.1)"
          />
          
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="5"
            stroke={mode === "focus" ? "hsl(var(--primary))" : "hsl(var(--warning))"}
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * progressPercentage) / 100}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
      </div>
      
      <div className={cn(
        "text-xl font-medium",
        mode === "focus" ? "text-primary" : "text-amber-500"
      )}>
        {mode === "focus" ? "Focus Time" : "Break Time"}
      </div>
    </div>
  );
};
