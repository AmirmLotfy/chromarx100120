
import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, PaintBucket, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/stores/settingsStore";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  const settings = useSettings();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const colorSchemes = [
    { value: "default", label: "Default", color: "#8B5CF6" },
    { value: "purple", label: "Purple", color: "#9333EA" },
    { value: "blue", label: "Blue", color: "#3B82F6" },
    { value: "green", label: "Green", color: "#10B981" },
  ];

  const themeOptions = [
    { 
      value: 'light', 
      label: 'Light',
      icon: <Sun className="h-5 w-5" />,
    },
    { 
      value: 'dark', 
      label: 'Dark', 
      icon: <Moon className="h-5 w-5" />,
    },
    { 
      value: 'system', 
      label: 'System',
      icon: <Monitor className="h-5 w-5" />,
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="mb-3">
        <h2 className="text-lg font-medium">Display</h2>
        <p className="text-sm text-muted-foreground">Customize how ChroMarx looks</p>
      </motion.div>

      <motion.div variants={item}>
        <div className="space-y-4 mb-6">
          <Label className="text-sm font-medium text-foreground/80">Theme Mode</Label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all",
                  theme === option.value 
                    ? "bg-primary/10 border-2 border-primary shadow-sm" 
                    : "bg-muted/40 border-2 border-transparent hover:bg-muted"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-full",
                  theme === option.value 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {option.icon}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  theme === option.value 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="space-y-4 mb-6">
          <Label className="text-sm font-medium text-foreground/80">Color Scheme</Label>
          <div className="grid grid-cols-4 gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => settings.setColorScheme(scheme.value as any)}
                className={cn(
                  "relative h-20 rounded-xl transition-all",
                  settings.colorScheme === scheme.value 
                    ? "ring-2 ring-primary shadow-md" 
                    : "ring-1 ring-border hover:ring-primary/50"
                )}
                style={{ backgroundColor: `${scheme.color}15` }}
              >
                <div 
                  className="absolute top-3 left-0 right-0 flex justify-center"
                >
                  <div 
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: scheme.color }}
                  />
                </div>
                
                {settings.colorScheme === scheme.value && (
                  <div className="absolute top-3 right-3 h-4 w-4 rounded-full bg-primary/90 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                
                <span className="absolute bottom-2 left-0 right-0 text-center text-xs font-medium">
                  {scheme.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="overflow-hidden border border-border/40 shadow-sm rounded-xl bg-card/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">High Contrast</Label>
                <p className="text-xs text-muted-foreground">
                  Increase contrast for better readability
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={settings.setHighContrast}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AppearanceSettings;
