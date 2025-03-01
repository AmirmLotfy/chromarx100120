
import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor, Check, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useIsMobile } from "@/hooks/use-mobile";

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  const settings = useSettings();
  const isMobile = useIsMobile();

  // Animation variants
  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      } 
    }
  };

  const colorSchemes = [
    { value: "default", label: "Default", color: "#8B5CF6" },
    { value: "purple", label: "Purple", color: "#9333EA" },
    { value: "blue", label: "Blue", color: "#3B82F6" },
    { value: "green", label: "Green", color: "#10B981" },
  ];

  return (
    <div className="space-y-8 pb-6">
      {/* Theme Selection */}
      <motion.section 
        variants={item}
        className="space-y-4"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Sun className="h-4.5 w-4.5 text-primary" />
          </div>
          <h3 className="text-base font-medium">Theme Mode</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
            { id: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
            { id: 'system', label: 'Auto', icon: <Monitor className="h-4 w-4" /> }
          ].map((option) => (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTheme(option.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-4 rounded-xl transition-colors",
                theme === option.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted/60 hover:bg-muted text-muted-foreground"
              )}
            >
              {option.icon}
              <span className="text-xs font-medium">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Color Scheme */}
      <motion.section 
        variants={item}
        className="space-y-4"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Palette className="h-4.5 w-4.5 text-primary" />
          </div>
          <h3 className="text-base font-medium">Color Accent</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {colorSchemes.map((scheme) => (
            <motion.button
              key={scheme.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => settings.setColorScheme(scheme.value as any)}
              className={cn(
                "relative h-20 rounded-xl transition-all overflow-hidden",
                settings.colorScheme === scheme.value 
                  ? "ring-2 ring-primary" 
                  : "ring-1 ring-border/70 hover:ring-primary/50"
              )}
              style={{ 
                backgroundColor: `${scheme.color}15`,
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div 
                  className="h-8 w-8 rounded-full mb-1"
                  style={{ backgroundColor: scheme.color }}
                />
                <span className="text-sm font-medium">
                  {scheme.label}
                </span>
              </div>
              
              {settings.colorScheme === scheme.value && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.section>
      
      {/* Accessibility Options */}
      <motion.section variants={item}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-primary"
            >
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l2 2"/>
              <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
            </svg>
          </div>
          <h3 className="text-base font-medium">Accessibility</h3>
        </div>
        
        <Card className="overflow-hidden border-border/30 shadow-sm bg-card/70 backdrop-blur-sm rounded-xl">
          <div className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">High Contrast</Label>
              <p className="text-xs text-muted-foreground">
                Increase contrast for better readability
              </p>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={settings.setHighContrast}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </Card>
      </motion.section>
      
      {/* Animation preferences */}
      <motion.section variants={item}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-primary"
            >
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
              <path d="M22 12A10 10 0 0 0 12 2v10z"/>
            </svg>
          </div>
          <h3 className="text-base font-medium">Animation</h3>
        </div>
        
        <Card className="overflow-hidden border-border/30 shadow-sm bg-card/70 backdrop-blur-sm rounded-xl">
          <div className="p-4 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">UI Animations</Label>
                <p className="text-xs text-muted-foreground">
                  Enable motion and effects
                </p>
              </div>
              <Switch
                checked={true}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-3 block">Animation Speed</Label>
              <RadioGroup defaultValue="normal" className="flex justify-between">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="slow" id="slow" />
                  <Label htmlFor="slow" className="text-xs">Slow</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="text-xs">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fast" id="fast" />
                  <Label htmlFor="fast" className="text-xs">Fast</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </Card>
      </motion.section>
    </div>
  );
};

export default AppearanceSettings;
