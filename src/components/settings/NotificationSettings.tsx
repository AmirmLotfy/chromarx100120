
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/stores/settingsStore";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bell, Bookmark, RefreshCw, Timer } from "lucide-react";

const NotificationSettings = () => {
  const settings = useSettings();

  const handleNotificationChange = (type: keyof typeof settings.notifications, enabled: boolean) => {
    settings.setNotifications(type, enabled);
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
      icon: <Bookmark className="h-4 w-4 text-primary/70" />
    },
    {
      type: 'updates' as const,
      label: 'App Updates',
      description: 'Learn about new features and improvements',
      icon: <RefreshCw className="h-4 w-4 text-primary/70" />
    },
    {
      type: 'reminders' as const,
      label: 'Reminders',
      description: 'Receive timer and task reminders',
      icon: <Timer className="h-4 w-4 text-primary/70" />
    }
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
              <Bell className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Notification Preferences</CardTitle>
            </div>
            <CardDescription>Manage how we notify you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationItems.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
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
                  checked={settings.notifications[item.type]}
                  onCheckedChange={(enabled) => handleNotificationChange(item.type, enabled)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default NotificationSettings;
