import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useSettings } from "@/stores/settingsStore";
import { useFirebase } from "@/contexts/FirebaseContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PrivacySettings = () => {
  const settings = useSettings();
  const { user } = useFirebase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Control your data and notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TooltipProvider>
          <div className="flex items-center justify-between p-4 bg-accent rounded-lg border border-accent-foreground/10 hover:border-accent-foreground/20 transition-colors">
            <div className="space-y-1">
              <Label className="text-lg font-semibold">Data Collection</Label>
              <p className="text-sm text-muted-foreground">
                Allow anonymous usage data collection
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Switch
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                    checked={settings.dataCollection}
                    onCheckedChange={(checked) => {
                      if (user?.uid) {
                        settings.setDataCollection(checked, user.uid);
                        toast.success('Data collection preference updated');
                      } else {
                        toast.error('Please sign in to save preferences');
                      }
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help improve ChroMarx by sharing anonymous usage data</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-4">
            <Label>Notification Settings</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bookmarks">Bookmark Updates</Label>
                <Switch
                  id="bookmarks"
                  checked={settings.notifications.bookmarks}
                  onCheckedChange={(checked) => {
                    if (user?.uid) {
                      settings.setNotifications("bookmarks", checked, user.uid);
                      toast.success('Bookmark notifications updated');
                    } else {
                      toast.error('Please sign in to save preferences');
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="updates">Extension Updates</Label>
                <Switch
                  id="updates"
                  checked={settings.notifications.updates}
                  onCheckedChange={(checked) => {
                    if (user?.uid) {
                      settings.setNotifications("updates", checked, user.uid);
                      toast.success('Update notifications updated');
                    } else {
                      toast.error('Please sign in to save preferences');
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reminders">Reminders</Label>
                <Switch
                  id="reminders"
                  checked={settings.notifications.reminders}
                  onCheckedChange={(checked) => {
                    if (user?.uid) {
                      settings.setNotifications("reminders", checked, user.uid);
                      toast.success('Reminder notifications updated');
                    } else {
                      toast.error('Please sign in to save preferences');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;