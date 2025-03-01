
import { CircularProgress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface TimerDisplayProps {
  timeLeft: number;
  mode: "focus" | "break";
}

export const TimerDisplay = ({ timeLeft, mode }: TimerDisplayProps) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isMobile = useIsMobile();
  
  // Calculate progress percentage based on mode
  const calculateProgress = () => {
    const baseDuration = mode === "focus" ? 25 * 60 : 5 * 60; // Default durations
    return Math.min(100, (timeLeft / baseDuration) * 100);
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full max-w-xs mx-auto"
    >
      <div className={`relative ${isMobile ? "w-64 h-64" : "w-72 h-72"} mx-auto`}>
        <CircularProgress
          value={calculateProgress()}
          className="w-full h-full -rotate-90"
          size={isMobile ? 256 : 288}
          strokeWidth={12}
        />
        
        <motion.div 
          className="absolute inset-0 flex items-center justify-center" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center">
            <motion.div 
              className={`${isMobile ? "text-5xl" : "text-6xl"} font-bold font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-primary to-secondary`}
              key={`${minutes}:${seconds}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </motion.div>
            
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                mode === "focus" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-secondary/10 text-secondary"
              }`}>
                {mode}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
