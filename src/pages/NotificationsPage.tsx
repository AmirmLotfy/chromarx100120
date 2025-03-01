
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BookmarkIcon, Check, Clock, Info, Settings, Trash } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// Mock notification type
interface Notification {
  id: string;
  title: string;
  message: string;
  type: "bookmarks" | "system" | "reminders";
  timestamp: string;
  read: boolean;
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // In a real app, you would fetch notifications from your backend or storage
    // For demo purposes, we'll create some mock notifications
    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "New bookmark sync completed",
        message: "All your bookmarks have been successfully synced across devices.",
        type: "bookmarks",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: "2",
        title: "Reminder: Review priority bookmarks",
        message: "You have 5 unread bookmarks in your priority list.",
        type: "reminders",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true
      },
      {
        id: "3",
        title: "System maintenance completed",
        message: "ChroMarx was updated to version 1.2.0 with new features.",
        type: "system",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    toast.success("Notification marked as read");
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map(notif => ({ ...notif, read: true }))
    );
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications(
      notifications.filter(notif => notif.id !== id)
    );
    toast.success("Notification deleted");
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bookmarks": return <BookmarkIcon className="h-4 w-4" />;
      case "reminders": return <Clock className="h-4 w-4" />;
      case "system": return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bookmarks": return "bg-blue-500";
      case "reminders": return "bg-amber-500";
      case "system": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={!notifications.some(n => !n.read)}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              <Trash className="h-4 w-4 mr-1" />
              Clear all
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <Card className="border-border/40">
            <ScrollArea className="h-[calc(100vh-240px)] rounded-md border-0">
              {filteredNotifications.length > 0 ? (
                <div className="p-4 space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-lg border ${notification.read ? 'bg-background' : 'bg-accent/20'}`}
                    >
                      <div className="flex gap-3">
                        <div className={`${getTypeColor(notification.type)} w-1 h-full rounded-full mt-1.5`} />
                        <div className="space-y-1 flex-1">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{notification.title}</span>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              {getTypeIcon(notification.type)}
                              <span className="text-xs capitalize">{notification.type}</span>
                            </div>
                            <div className="flex gap-2">
                              {!notification.read && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 text-xs"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark read
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 py-10">
                  <Bell className="h-10 w-10 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No notifications found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeTab === "all" 
                      ? "You're all caught up!"
                      : `No ${activeTab} notifications available`}
                  </p>
                </div>
              )}
            </ScrollArea>
          </Card>
        </Tabs>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
