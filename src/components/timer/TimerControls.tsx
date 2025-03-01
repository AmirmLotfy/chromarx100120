
import { motion } from "framer-motion";
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
    <motion.div 
      className="flex justify-center gap-6 mt-8"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <motion.div
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className="relative"
      >
        <Button
          size="lg"
          className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
          onClick={isRunning ? onPause : onStart}
        >
          {isRunning ? (
            <Pause className="w-8 h-8 text-primary-foreground" />
          ) : (
            <Play className="w-8 h-8 ml-1 text-primary-foreground" />
          )}
        </Button>
        {/* Glow effect for primary button */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10 animate-pulse"></div>
      </motion.div>
      
      <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}>
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 hover:bg-muted transition-all duration-300"
          onClick={onReset}
        >
          <RotateCcw className="w-6 h-6" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
