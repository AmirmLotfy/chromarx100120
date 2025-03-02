
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/stores/settingsStore";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Bell, Bookmark, RefreshCw, Timer, Cloud, Volume2, Zap, AppWindow } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NotificationSettings = () => {
  const settings = useSettings();
  const { user } = useAuth();

  const handleNotificationChange = (type: keyof typeof settings.notifications, enabled: boolean) => {
    settings.setNotifications(type, enabled, user?.id);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${enabled ? 'enabled' : 'disabled'}`);
  };

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

  const notificationItems = [
    {
      type: 'bookmarks' as const,
      label: 'Bookmark Updates',
      description: 'Get notified about bookmark changes',
      icon: <Bookmark className="h-4 w-4 text-blue-500" />
    },
    {
      type: 'updates' as const,
      label: 'App Updates',
      description: 'Learn about new features and improvements',
      icon: <RefreshCw className="h-4 w-4 text-purple-500" />
    },
    {
      type: 'reminders' as const,
      label: 'Reminders',
      description: 'Receive timer and task reminders',
      icon: <Timer className="h-4 w-4 text-amber-500" />
    },
    {
      type: 'sounds' as const,
      label: 'Sound Alerts',
      description: 'Enable sound for important notifications',
      icon: <Volume2 className="h-4 w-4 text-green-500" />
    },
    {
      type: 'suggestions' as const,
      label: 'AI Suggestions',
      description: 'Get intelligent recommendations',
      icon: <Zap className="h-4 w-4 text-indigo-500" />
    }
  ];

  const formatLastSynced = () => {
    if (!settings.lastSynced) return "Never synced";
    const date = new Date(settings.lastSynced);
    return `Last synced: ${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={item}>
        <Card className="overflow-hidden border border-border/40 shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-medium">Notification Preferences</CardTitle>
                  <CardDescription className="text-xs">
                    Manage how we notify you
                  </CardDescription>
                </div>
              </div>
              {settings.cloudBackupEnabled && (
                <Badge variant="outline" className="text-xs gap-1 items-center">
                  <Cloud className="h-3 w-3" />
                  {settings.syncInProgress ? "Syncing..." : formatLastSynced()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {notificationItems.map((item) => (
              <div key={item.type} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                <div className="flex gap-3">
                  <div className="mt-0.5">{item.icon}</div>
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{item.label}</Label>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications[item.type as keyof typeof settings.notifications] || false}
                  onCheckedChange={(enabled) => handleNotificationChange(item.type, enabled)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AppWindow className="h-4 w-4 text-teal-500" />
                  <Label className="text-sm font-medium">Alert Style</Label>
                </div>
                <Badge variant="outline" className="text-xs">Coming soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default NotificationSettings;
