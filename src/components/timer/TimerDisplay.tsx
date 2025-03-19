
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
  maxTime = timeLeft,
}) => {
  // Format the time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = (timeLeft / maxTime) * 100;

  return (
    <div className="flex flex-col items-center justify-center w-full py-4">
      {/* Radial progress indicator */}
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            stroke="rgba(0,0,0,0.1)"
            className="dark:stroke-gray-700"
          />
          
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            stroke={mode === "focus" ? "hsl(var(--primary))" : "hsl(var(--warning))"}
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * progressPercentage) / 100}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          
          {/* Time text in the center */}
          <text
            x="50"
            y="50"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="16"
            fill="currentColor"
            className="font-medium"
          >
            {mode === "focus" ? "FOCUS" : "BREAK"}
          </text>
          
          <text
            x="50"
            y="62"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="22"
            fontWeight="bold"
            fill="currentColor"
            className="font-mono"
          >
            {formatTime(timeLeft)}
          </text>
        </svg>
      </div>
      
      <div className={cn(
        "text-lg font-medium mt-2",
        mode === "focus" ? "text-primary" : "text-amber-500"
      )}>
        {mode === "focus" ? "Focus Session" : "Break Time"}
      </div>
    </div>
  );
};
