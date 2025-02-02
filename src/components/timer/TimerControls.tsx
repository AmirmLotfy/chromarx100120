import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export const TimerControls = ({
  isRunning,
  onStart,
  onPause,
  onReset,
}: TimerControlsProps) => {
  return (
    <div className="flex justify-center gap-4">
      <Button
        size="lg"
        className="w-16 h-16 rounded-full"
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-16 h-16 rounded-full"
        onClick={onReset}
      >
        <RotateCcw className="w-6 h-6" />
      </Button>
    </div>
  );
};