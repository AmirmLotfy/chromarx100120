
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Bell, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "achievement" | "goal" | "insight";
  timestamp: string;
  read: boolean;
}

const ProductivityNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Demo notifications
    const demoNotifications: Notification[] = [
      {
        id: crypto.randomUUID(),
        title: "New Achievement Unlocked!",
        message: "You've maintained focus for 2 hours straight!",
        type: "achievement",
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: crypto.randomUUID(),
        title: "Productivity Goal Update",
        message: "You're 80% toward your 'Reduce social media' goal",
        type: "goal",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true
      },
      {
        id: crypto.randomUUID(),
        title: "AI Insight",
        message: "Your productivity peaks between 9-11 AM. Schedule important tasks then!",
        type: "insight",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        read: true
      }
    ];

    setNotifications(demoNotifications);
    
    // Show toast for unread notifications
    const unreadCount = demoNotifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
      toast.success(`You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}!`);
    }
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "achievement": return "bg-green-500";
      case "goal": return "bg-blue-500";
      case "insight": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 24 * 60) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="p-4 space-y-4 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Notifications</h3>
        <div className="relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {notifications.some(n => !n.read) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
      </div>

      <ScrollArea className="h-[220px] -mx-2 px-2">
        <div className="space-y-3 pb-1">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors relative ${
                !notification.read ? "bg-primary/5 hover:bg-primary/10" : "bg-muted/20 hover:bg-muted/30"
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`${getTypeColor(notification.type)} w-2 h-2 rounded-full mt-1.5`} />
                
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(notification.timestamp)}
                    </span>
                    
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {notification.type}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {!notification.read && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          ))}
          
          {notifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No new notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ProductivityNotifications;
