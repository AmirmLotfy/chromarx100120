
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
    <div className="flex justify-center items-center gap-3 my-1">
      <Button
        size="icon"
        variant="outline"
        className="w-9 h-9 rounded-full border-2 hover:bg-accent/50"
        onClick={onReset}
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      
      <Button
        size="lg"
        className={cn(
          "w-14 h-14 rounded-full shadow-md transition-all duration-300",
          "bg-gradient-to-br hover:bg-gradient-to-r",
          isRunning 
            ? "from-red-500 to-red-600 hover:from-red-600 hover:to-red-500"
            : mode === "focus"
              ? "from-primary to-purple-600 hover:from-purple-600 hover:to-primary"
              : "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500"
        )}
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? 
          <Pause className="w-5 h-5" /> : 
          <Play className="w-5 h-5 ml-0.5" />
        }
      </Button>
      
      {onModeToggle && (
        <Button
          size="icon"
          variant="outline"
          className="w-9 h-9 rounded-full border-2 hover:bg-accent/50"
          onClick={onModeToggle}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
