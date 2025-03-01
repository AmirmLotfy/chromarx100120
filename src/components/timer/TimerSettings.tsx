
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Duration</Label>
          <span className="text-sm font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
            {duration} min
          </span>
        </div>
        <Slider
          value={[duration]}
          onValueChange={(value) => onDurationChange(value[0])}
          min={1}
          max={60}
          step={1}
          className="py-1"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 min</span>
          <span>30 min</span>
          <span>60 min</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Mode</Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && onModeChange(value as "focus" | "break")}
          className="justify-center border rounded-xl p-1 bg-accent/50"
        >
          <ToggleGroupItem 
            value="focus" 
            aria-label="Focus mode"
            className={cn(
              "flex-1 data-[state=on]:bg-primary data-[state=on]:text-white rounded-lg",
              "transition-all duration-200"
            )}
          >
            Focus
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="break" 
            aria-label="Break mode"
            className={cn(
              "flex-1 data-[state=on]:bg-blue-500 data-[state=on]:text-white rounded-lg",
              "transition-all duration-200"
            )}
          >
            Break
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
