
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
    hidden: { opacity: 0, y: 5 },
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
    <div className="space-y-6">
      {/* Theme Selection - Mobile friendly cards */}
      <motion.section 
        variants={item}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Theme Mode</h3>
        
        <div className="grid grid-cols-1 gap-3">
          {[
            { id: 'light', label: 'Light', icon: <Sun className="h-5 w-5" /> },
            { id: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" /> },
            { id: 'system', label: 'Auto', icon: <Monitor className="h-5 w-5" /> }
          ].map((option) => (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme(option.id)}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl transition-all min-h-[60px] touch-target shadow-sm",
                theme === option.id 
                  ? "bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground" 
                  : "bg-muted/60 hover:bg-muted/80 text-muted-foreground border border-border/10"
              )}
            >
              <div className="flex items-center gap-3">
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
                  "text-base font-medium",
                  theme === option.id ? "text-primary-foreground" : ""
                )}>{option.label}</span>
              </div>
              
              {theme === option.id && (
                <div className="h-5 w-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Color Scheme - Mobile optimized list */}
      <motion.section 
        variants={item}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Color Accent</h3>
        
        <div className="grid grid-cols-1 gap-3">
          {colorSchemes.map((scheme) => (
            <motion.button
              key={scheme.value}
              whileTap={{ scale: 0.98 }}
              onClick={() => settings.setColorScheme(scheme.value as any)}
              className={cn(
                "relative flex items-center justify-between p-4 rounded-xl min-h-[60px] touch-target transition-all shadow-sm",
                settings.colorScheme === scheme.value 
                  ? "ring-2 ring-primary" 
                  : "ring-1 ring-border/30 hover:ring-primary/50"
              )}
              style={{ 
                backgroundColor: `${scheme.color}15`,
                background: settings.colorScheme === scheme.value 
                  ? `linear-gradient(90deg, ${scheme.color}30, ${scheme.color}15)` 
                  : `${scheme.color}15`
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="h-10 w-10 rounded-full shadow-sm"
                  style={{ backgroundColor: scheme.color }}
                />
                <span className="text-base font-medium">
                  {scheme.label}
                </span>
              </div>
              
              {settings.colorScheme === scheme.value && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.section>
      
      {/* Accessibility Options */}
      <motion.section variants={item}>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Accessibility</h3>
        
        <Card className="border-border/20 shadow-sm bg-card/90 rounded-xl">
          <div className="flex items-center justify-between p-4 touch-target min-h-[60px]">
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
      
      {/* Animation preferences */}
      <motion.section variants={item}>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Animation</h3>
        
        <Card className="border-border/20 shadow-sm bg-card/90 rounded-xl overflow-hidden">
          <div className="p-4 space-y-5">
            <div className="flex items-center justify-between touch-target min-h-[48px]">
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
            
            <div className="pt-1">
              <Label className="text-base font-medium mb-3 block">Animation Speed</Label>
              <div className="grid grid-cols-3 gap-2">
                {['slow', 'normal', 'fast'].map((speed) => (
                  <div 
                    key={speed}
                    className={cn(
                      "flex justify-center rounded-lg py-4 border border-border/20 touch-target",
                      speed === 'normal' ? "bg-primary/10" : "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value={speed} id={speed} className="text-primary" />
                      <Label htmlFor={speed} className="text-sm capitalize">{speed}</Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.section>
    </div>
  );
};

export default AppearanceSettings;
