import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/stores/settingsStore";
import { toast } from "sonner";

const AdvancedSettings = () => {
  const settings = useSettings();

  const handleExperimentalFeaturesToggle = (enabled: boolean) => {
    settings.setExperimentalFeatures(enabled);
    if (enabled) {
      toast.success("Experimental features enabled! You now have access to beta features.");
    } else {
      toast.info("Experimental features disabled");
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings? This cannot be undone.")) {
      settings.resetSettings();
      toast.success("All settings have been reset to default values");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>
          Configure advanced features and experimental options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Experimental Features</Label>
            <p className="text-sm text-muted-foreground">
              Enable experimental features and beta testing options.
              {settings.experimentalFeatures && (
                <span className="block text-yellow-500 dark:text-yellow-400 mt-1">
                  ⚠️ These features are in beta and may be unstable
                </span>
              )}
            </p>
          </div>
          <Switch
            checked={settings.experimentalFeatures}
            onCheckedChange={handleExperimentalFeaturesToggle}
          />
        </div>

        {settings.experimentalFeatures && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium">Active Beta Features:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Enhanced AI processing for bookmarks</li>
              <li>Advanced analytics dashboard</li>
              <li>New experimental UI components</li>
            </ul>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            onClick={handleReset}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset All Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSettings;