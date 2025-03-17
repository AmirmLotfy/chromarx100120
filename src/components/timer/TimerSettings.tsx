
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TimerSettingsProps {
  duration: number;
  onDurationChange: (newDuration: number) => void;
  mode: "focus" | "break";
  disabled?: boolean;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
  duration,
  onDurationChange,
  mode,
  disabled = false
}) => {
  // Convert seconds to minutes
  const durationInMinutes = Math.floor(duration / 60);
  
  // Duration options depending on the mode
  const minDuration = mode === 'focus' ? 5 : 1;
  const maxDuration = mode === 'focus' ? 120 : 30;
  
  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    // Convert minutes back to seconds
    const newDuration = values[0] * 60;
    onDurationChange(newDuration);
  };
  
  // Predefined duration options
  const focusPresets = [15, 25, 45, 60, 90];
  const breakPresets = [5, 10, 15, 20, 30];
  const presets = mode === 'focus' ? focusPresets : breakPresets;
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="duration">Duration: {durationInMinutes} minutes</Label>
        </div>
        <Slider
          id="duration"
          disabled={disabled}
          min={minDuration}
          max={maxDuration}
          step={1}
          value={[durationInMinutes]}
          onValueChange={handleSliderChange}
          className="w-full"
        />
      </div>
      
      <div>
        <Label className="mb-2 block">Quick Presets</Label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              disabled={disabled}
              onClick={() => onDurationChange(preset * 60)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors
                ${durationInMinutes === preset
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-input'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {preset} min
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <Tabs defaultValue="sound" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sound">Sound</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="sound" className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="sound-volume">Volume</Label>
              <span className="text-sm">70%</span>
            </div>
            <Slider
              id="sound-volume"
              disabled={disabled}
              defaultValue={[70]}
              max={100}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between items-center mt-4">
              <Label>Sound Theme</Label>
              <select 
                className="px-2 py-1 border rounded-md bg-background"
                disabled={disabled}
              >
                <option>Forest</option>
                <option>Ocean</option>
                <option>Cafe</option>
                <option>White Noise</option>
              </select>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="desktop-notifications"
                defaultChecked
                disabled={disabled}
                className="rounded border-gray-300"
              />
              <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="play-sound"
                defaultChecked
                disabled={disabled}
                className="rounded border-gray-300"
              />
              <Label htmlFor="play-sound">Play Sound on Completion</Label>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
