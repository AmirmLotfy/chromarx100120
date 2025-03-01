
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { motion } from "framer-motion";

interface TimerSettingsProps {
  duration: number;
  mode: "focus" | "break";
  onDurationChange: (duration: number) => void;
  onModeChange: (mode: "focus" | "break") => void;
}

export const TimerSettings = ({
  duration,
  mode,
  onDurationChange,
  onModeChange,
}: TimerSettingsProps) => {
  return (
    <motion.div 
      className="space-y-6 mt-8 max-w-md mx-auto px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Duration</Label>
          <div className="px-3 py-1 rounded-full bg-accent text-sm font-medium">
            {duration} min
          </div>
        </div>
        
        <Slider
          value={[duration]}
          onValueChange={(value) => onDurationChange(value[0])}
          min={1}
          max={60}
          step={1}
          className="py-4"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>1 min</span>
          <span>30 min</span>
          <span>60 min</span>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Mode</Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && onModeChange(value as "focus" | "break")}
          className="justify-center w-full grid grid-cols-2 gap-2"
        >
          <ToggleGroupItem 
            value="focus" 
            aria-label="Focus mode"
            className={`rounded-full py-3 ${mode === 'focus' ? 'bg-primary/10 text-primary' : ''}`}
          >
            Focus
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="break" 
            aria-label="Break mode"
            className={`rounded-full py-3 ${mode === 'break' ? 'bg-secondary/10 text-secondary' : ''}`}
          >
            Break
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </motion.div>
  );
};
