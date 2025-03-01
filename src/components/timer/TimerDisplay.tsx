
import { CircularProgress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  timeLeft: number;
  mode: "focus" | "break";
  maxTime: number;
}

export const TimerDisplay = ({ timeLeft, mode, maxTime }: TimerDisplayProps) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Calculate the correct percentage for the progress ring
  const percentage = maxTime > 0 ? (timeLeft / maxTime) * 100 : 0;

  return (
    <div className="relative w-full max-w-[280px] mx-auto aspect-square">
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center">
          <div 
            className={cn(
              "text-6xl md:text-7xl font-bold font-mono tracking-tight",
              "bg-clip-text text-transparent bg-gradient-to-r",
              mode === "focus" 
                ? "from-primary to-purple-500" 
                : "from-blue-400 to-cyan-500"
            )}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div 
            className={cn(
              "text-sm text-muted-foreground mt-2 capitalize py-1 px-3 rounded-full",
              "inline-block",
              mode === "focus" 
                ? "bg-primary/10 text-primary" 
                : "bg-blue-500/10 text-blue-500"
            )}
          >
            {mode} Mode
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[92%] h-[92%] rounded-full bg-accent/30 animate-pulse opacity-20"></div>
      </div>
      
      <CircularProgress
        value={percentage}
        className="w-full h-full -rotate-90"
        size={280}
        strokeWidth={12}
      />
    </div>
  );
};
