import { CircularProgress } from "@/components/ui/progress";

interface TimerDisplayProps {
  timeLeft: number;
  mode: "focus" | "break";
}

export const TimerDisplay = ({ timeLeft, mode }: TimerDisplayProps) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative w-64 h-64 mx-auto">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="text-sm text-muted-foreground mt-2 capitalize">
            {mode} Mode
          </div>
        </div>
      </div>
      <CircularProgress
        value={(timeLeft / (25 * 60)) * 100}
        className="w-full h-full -rotate-90"
      />
    </div>
  );
};