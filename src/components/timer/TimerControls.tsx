
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onModeToggle: () => void;
  mode: 'focus' | 'break';
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  onModeToggle,
  mode
}) => {
  return (
    <div className="w-full flex flex-col items-center space-y-2 mt-2">
      <div className="flex justify-center items-center space-x-3">
        {isRunning ? (
          <Button 
            onClick={onPause}
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full"
          >
            <Pause className="h-5 w-5" />
          </Button>
        ) : (
          <Button 
            onClick={onStart}
            variant="default"
            size="icon"
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground"
          >
            <Play className="h-5 w-5 ml-0.5" />
          </Button>
        )}
        
        <Button 
          onClick={onReset}
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-full"
          disabled={!isRunning && !onReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <Button
        onClick={onModeToggle}
        variant="ghost"
        size="sm"
        className="text-xs gap-1.5 h-8 mt-2"
      >
        {mode === 'focus' ? (
          <>
            <Coffee className="h-3.5 w-3.5" />
            Switch to Break
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" />
            Switch to Focus
          </>
        )}
      </Button>
    </div>
  );
};
