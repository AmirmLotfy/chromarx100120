
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onModeToggle?: () => void;
  mode?: "focus" | "break";
}

export const TimerControls = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  onModeToggle,
  mode = "focus",
}: TimerControlsProps) => {
  return (
    <div className="flex justify-center items-center gap-6">
      <Button
        size="lg"
        className={cn(
          "w-20 h-20 rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-to-br hover:bg-gradient-to-r",
          isRunning 
            ? "from-red-500 to-red-600 hover:from-red-600 hover:to-red-500"
            : "from-primary to-purple-600 hover:from-purple-600 hover:to-primary"
        )}
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? 
          <Pause className="w-8 h-8" /> : 
          <Play className="w-8 h-8 ml-1" />
        }
      </Button>
      <Button
        size="icon"
        variant="outline"
        className="w-12 h-12 rounded-full border-2 hover:bg-accent/50"
        onClick={onReset}
      >
        <RotateCcw className="w-5 h-5" />
      </Button>
      
      {onModeToggle && (
        <Button
          size="icon"
          variant="outline"
          className="w-12 h-12 rounded-full border-2 hover:bg-accent/50"
          onClick={onModeToggle}
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};
