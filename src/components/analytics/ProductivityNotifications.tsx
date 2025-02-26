
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Bell, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
    // TODO: Implement real-time notifications
    const audio = new Audio("/notification.mp3");
    
    const demoNotification: Notification = {
      id: crypto.randomUUID(),
      title: "New Achievement Unlocked!",
      message: "You've maintained focus for 2 hours straight!",
      type: "achievement",
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [demoNotification, ...prev]);
    audio.play().catch(console.error);
    
    toast.success("New achievement unlocked!", {
      description: "You've maintained focus for 2 hours straight!"
    });
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <Bell className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
              !notification.read ? "bg-primary/5" : ""
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-medium text-sm">{notification.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleString()}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
            </div>
          </Card>
        ))}
        
        {notifications.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No new notifications
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductivityNotifications;
