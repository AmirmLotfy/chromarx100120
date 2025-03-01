
import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/stores/settingsStore";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  const settings = useSettings();
  const isMobile = useIsMobile();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  const colorSchemes = [
    { value: "default", label: "Default", color: "#8B5CF6" },
    { value: "purple", label: "Purple", color: "#9333EA" },
    { value: "blue", label: "Blue", color: "#3B82F6" },
    { value: "green", label: "Green", color: "#10B981" },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Theme Selection */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Sun className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-base font-medium">Theme Mode</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-2">
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
                "flex flex-col items-center justify-center gap-2 py-4 rounded-xl transition-all",
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
      </motion.div>

      {/* Color Scheme */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-base font-medium">Color Accent</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {colorSchemes.map((scheme) => (
            <motion.button
              key={scheme.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => settings.setColorScheme(scheme.value as any)}
              className={cn(
                "relative flex-1 h-16 min-w-16 rounded-xl transition-all overflow-hidden",
                settings.colorScheme === scheme.value 
                  ? "ring-2 ring-primary" 
                  : "ring-1 ring-border hover:ring-primary/50"
              )}
              style={{ 
                backgroundColor: `${scheme.color}15`,
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div 
                  className="h-6 w-6 rounded-full mb-1"
                  style={{ backgroundColor: scheme.color }}
                />
                <span className="text-xs font-medium">
                  {scheme.label}
                </span>
              </div>
              
              {settings.colorScheme === scheme.value && (
                <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
      
      {/* Accessibility Options */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
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
              <path d="M18.3 16.3A9 9 0 0 0 21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9"/>
              <path d="M15.3 15.3a5 5 0 0 0-3.3-9.3 5 5 0 0 0-3.3 9.3"/>
              <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
            </svg>
          </div>
          <h3 className="text-base font-medium">Accessibility</h3>
        </div>
        
        <Card className="overflow-hidden border-none shadow-none bg-transparent rounded-xl">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 backdrop-blur-sm">
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
      </motion.div>
      
      {/* Animation preferences - new section */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
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
          <h3 className="text-base font-medium">Animation</h3>
        </div>
        
        <div className="p-3 rounded-xl bg-muted/40 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">UI Animations</Label>
            <Switch
              checked={true}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          <div className="mt-3">
            <Label className="text-sm font-medium mb-3 block">Animation Speed</Label>
            <RadioGroup defaultValue="normal" className="flex">
              <div className="flex items-center space-x-2 mr-4">
                <RadioGroupItem value="slow" id="slow" />
                <Label htmlFor="slow" className="text-xs">Slow</Label>
              </div>
              <div className="flex items-center space-x-2 mr-4">
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
      </motion.div>
    </motion.div>
  );
};

export default AppearanceSettings;
