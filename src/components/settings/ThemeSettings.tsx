import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/stores/settingsStore";
import { Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";

type ColorScheme = "default" | "purple" | "blue" | "green";

const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const settings = useSettings();

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleThemeChange = (value: string) => {
    setTheme(value);
    toast.success(`Theme changed to ${value} mode`);
  };

  const handleColorSchemeChange = (value: ColorScheme) => {
    settings.setColorScheme(value);
    toast.success(`Color scheme updated to ${value}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>
          Customize how ChroMarx looks on your device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Theme Mode</Label>
            <p className="text-sm text-muted-foreground">
              Choose between light, dark, or system theme
            </p>
          </div>
          <Select value={theme} onValueChange={handleThemeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center">
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center">
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center">
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Color Scheme</Label>
            <p className="text-sm text-muted-foreground">
              Select your preferred color scheme
            </p>
          </div>
          <Select
            value={settings.colorScheme}
            onValueChange={handleColorSchemeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select scheme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="purple">Purple</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>High Contrast</Label>
            <p className="text-sm text-muted-foreground">
              Enable high contrast mode for better visibility
            </p>
          </div>
          <Switch
            checked={settings.highContrast}
            onCheckedChange={(checked) => {
              settings.setHighContrast(checked);
              toast.success(
                `High contrast mode ${checked ? "enabled" : "disabled"}`
              );
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSettings;