
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/stores/settingsStore";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Bell, Bookmark, RefreshCw, Timer, Cloud, Mail, Monitor, Smartphone, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const NotificationSettings = () => {
  const settings = useSettings();
  const { user } = useAuth();

  const handleNotificationChange = (type: keyof typeof settings.notifications, enabled: boolean) => {
    settings.setNotifications(type, enabled, user?.id);
    toast.success(`${formatLabel(type)} notifications ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleFrequencyChange = (value: string) => {
    if (value === 'immediate' || value === 'daily' || value === 'weekly') {
      settings.setNotifications('frequency', value, user?.id);
      toast.success(`Notification frequency set to ${value}`);
    }
  };

  const formatLabel = (key: string): string => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
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

  const deliveryMethods = [
    {
      type: 'email' as const,
      label: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: <Mail className="h-4 w-4 text-primary/70" />
    },
    {
      type: 'push' as const,
      label: 'Push Notifications',
      description: 'Receive notifications on your mobile device',
      icon: <Smartphone className="h-4 w-4 text-primary/70" />
    },
    {
      type: 'desktop' as const,
      label: 'Desktop Notifications',
      description: 'Receive notifications on your desktop',
      icon: <Monitor className="h-4 w-4 text-primary/70" />
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
        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Notification Preferences</CardTitle>
            </div>
            <CardDescription className="flex items-center justify-between">
              <span>Manage how we notify you</span>
              {settings.cloudBackupEnabled && (
                <Badge variant="outline" className="text-xs gap-1 items-center">
                  <Cloud className="h-3 w-3" />
                  {settings.syncInProgress ? "Syncing..." : formatLastSynced()}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Types</h3>
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
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Delivery Methods</h3>
              {deliveryMethods.map((item) => (
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
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary/70" />
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm font-medium">Notification Frequency</Label>
                  <p className="text-xs text-muted-foreground">
                    How often you'd like to receive notifications
                  </p>
                </div>
                <div className="w-1/3">
                  <Select 
                    value={settings.notifications.frequency} 
                    onValueChange={handleFrequencyChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default NotificationSettings;
