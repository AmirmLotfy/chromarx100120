
import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, PaintBucket, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      icon: <Sun className="h-4 w-4" />,
      description: 'Light mode for daytime use'
    },
    { 
      value: 'dark', 
      label: 'Dark', 
      icon: <Moon className="h-4 w-4" />,
      description: 'Dark mode for low-light conditions'
    },
    { 
      value: 'system', 
      label: 'System',
      icon: <Monitor className="h-4 w-4" />,
      description: 'Match your system theme'
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={item}>
        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <PaintBucket className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Appearance</CardTitle>
            </div>
            <CardDescription>Customize how ChroMarx looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Theme Mode</Label>
              <RadioGroup 
                value={theme} 
                onValueChange={setTheme}
                className="grid grid-cols-3 gap-2"
              >
                {themeOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`theme-${option.value}`}
                    className={cn(
                      "flex flex-col items-center justify-between rounded-lg border-2 border-muted p-3 cursor-pointer hover:border-primary/50 transition-all",
                      theme === option.value && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`theme-${option.value}`}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center gap-1">
                      {option.icon}
                      <span className="mt-1 text-xs font-medium">{option.label}</span>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-4">
              <Label className="text-sm font-medium">Color Scheme</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.value}
                    onClick={() => settings.setColorScheme(scheme.value as any)}
                    className={cn(
                      "relative h-16 rounded-lg border border-muted transition-all",
                      settings.colorScheme === scheme.value && "ring-2 ring-primary"
                    )}
                    style={{ backgroundColor: `${scheme.color}20` }}
                  >
                    <div 
                      className="absolute top-2 left-2 h-4 w-4 rounded-full" 
                      style={{ backgroundColor: scheme.color }}
                    />
                    {settings.colorScheme === scheme.value && (
                      <div className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2 w-2 text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 text-[10px] font-medium">
                      {scheme.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
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
