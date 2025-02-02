import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Duration (minutes)</Label>
        <Slider
          value={[duration]}
          onValueChange={(value) => onDurationChange(value[0])}
          min={1}
          max={60}
          step={1}
        />
        <div className="text-sm text-muted-foreground text-center">
          {duration} minutes
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mode</Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && onModeChange(value as "focus" | "break")}
          className="justify-center"
        >
          <ToggleGroupItem value="focus" aria-label="Focus mode">
            Focus
          </ToggleGroupItem>
          <ToggleGroupItem value="break" aria-label="Break mode">
            Break
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};