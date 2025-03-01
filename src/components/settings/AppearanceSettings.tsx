
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
      {/* Theme Selection - Enhanced with Gradient Cards */}
      <motion.section 
        variants={item}
        className="space-y-4"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sun className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Theme Mode</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: <Sun className="h-5 w-5" /> },
            { id: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" /> },
            { id: 'system', label: 'Auto', icon: <Monitor className="h-5 w-5" /> }
          ].map((option) => (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTheme(option.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-2.5 py-5 rounded-xl transition-all touch-target shadow-sm",
                theme === option.id 
                  ? "bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground" 
                  : "bg-muted/60 hover:bg-muted/80 text-muted-foreground border border-border/10"
              )}
            >
              <div 
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full", 
                  theme === option.id 
                    ? "bg-primary-foreground/20" 
                    : "bg-primary/10"
                )}
              >
                <span className={theme === option.id ? "text-primary-foreground" : "text-primary/70"}>
                  {option.icon}
                </span>
              </div>
              <span className={cn(
                "text-sm font-medium",
                theme === option.id ? "text-primary-foreground" : ""
              )}>{option.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Color Scheme - Enhanced with Larger Touch Targets */}
      <motion.section 
        variants={item}
        className="space-y-4"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Color Accent</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {colorSchemes.map((scheme) => (
            <motion.button
              key={scheme.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => settings.setColorScheme(scheme.value as any)}
              className={cn(
                "relative h-24 rounded-xl transition-all overflow-hidden shadow-sm touch-target",
                settings.colorScheme === scheme.value 
                  ? "ring-2 ring-primary" 
                  : "ring-1 ring-border/30 hover:ring-primary/50"
              )}
              style={{ 
                backgroundColor: `${scheme.color}15`,
                background: settings.colorScheme === scheme.value 
                  ? `linear-gradient(135deg, ${scheme.color}30, ${scheme.color}15)` 
                  : `${scheme.color}15`
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div 
                  className="h-10 w-10 rounded-full mb-2 shadow-sm"
                  style={{ backgroundColor: scheme.color }}
                />
                <span className="text-sm font-medium">
                  {scheme.label}
                </span>
              </div>
              
              {settings.colorScheme === scheme.value && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.section>
      
      {/* Accessibility Options - Enhanced Card Design */}
      <motion.section variants={item}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
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
          <h3 className="text-lg font-medium">Accessibility</h3>
        </div>
        
        <Card className="overflow-hidden border-border/20 shadow-md bg-card/90 backdrop-blur-sm rounded-xl">
          <div className="flex items-center justify-between p-4 touch-target">
            <div className="space-y-1">
              <Label className="text-base font-medium">High Contrast</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better readability
              </p>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={settings.setHighContrast}
              className="data-[state=checked]:bg-primary scale-110"
            />
          </div>
        </Card>
      </motion.section>
      
      {/* Animation preferences - Enhanced Layout */}
      <motion.section variants={item}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
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
          <h3 className="text-lg font-medium">Animation</h3>
        </div>
        
        <Card className="overflow-hidden border-border/20 shadow-md bg-card/90 backdrop-blur-sm rounded-xl">
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between touch-target">
              <div className="space-y-1">
                <Label className="text-base font-medium">UI Animations</Label>
                <p className="text-sm text-muted-foreground">
                  Enable motion and effects
                </p>
              </div>
              <Switch
                checked={true}
                className="data-[state=checked]:bg-primary scale-110"
              />
            </div>
            
            <div className="pt-2">
              <Label className="text-base font-medium mb-4 block">Animation Speed</Label>
              <RadioGroup defaultValue="normal" className="flex justify-between gap-2">
                {['slow', 'normal', 'fast'].map((speed) => (
                  <div 
                    key={speed}
                    className={cn(
                      "flex-1 flex flex-col items-center rounded-lg py-3 border border-border/20 touch-target",
                      speed === 'normal' ? "bg-primary/10" : "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <RadioGroupItem value={speed} id={speed} className="text-primary" />
                      <Label htmlFor={speed} className="text-sm capitalize">{speed}</Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </Card>
      </motion.section>
    </div>
  );
};

export default AppearanceSettings;
