import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bell, BookmarkIcon, Check, Clock, Info, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  const [activeCategory, setActiveCategory] = useState("all");
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
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
      },
      {
        id: "4",
        title: "Weekly summary available",
        message: "Check out your productivity insights for the past week.",
        type: "system",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: "5",
        title: "Bookmark categories updated",
        message: "Your bookmark categories have been reorganized based on your usage patterns.",
        type: "bookmarks",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
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

  const filteredNotifications = activeCategory === "all" 
    ? notifications 
    : notifications.filter(n => n.type === activeCategory);

  const unreadCount = notifications.filter(n => !n.read).length;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="bg-background pb-20">
        <div className="bg-gradient-to-r from-primary/80 to-primary/90 text-white">
          <div className="container px-4 pt-6 pb-8 relative">
            <div className="flex items-center gap-2 mb-2">
              <Link to="/">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Notifications</h1>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-white/80 text-sm">
                Stay updated with your activity
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background shadow-sm border-b">
          <div className="container px-4 py-2">
            <ToggleGroup
              type="single"
              value={activeCategory}
              onValueChange={(value) => {
                if (value) setActiveCategory(value);
              }}
              className="flex justify-between w-full bg-muted/30 p-1 rounded-full"
            >
              <ToggleGroupItem 
                value="all" 
                className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-white rounded-full text-xs py-2"
              >
                All
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="bookmarks" 
                className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-white rounded-full text-xs py-2"
              >
                Bookmarks
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="reminders" 
                className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-white rounded-full text-xs py-2"
              >
                Reminders
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="system" 
                className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-white rounded-full text-xs py-2"
              >
                System
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="container mx-auto px-4 pt-6">
          {filteredNotifications.length > 0 && (
            <div className="flex justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={!notifications.some(n => !n.read)}
                className="rounded-full text-xs border-muted-foreground/20 shadow-sm"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={clearAllNotifications}
                className="rounded-full text-xs border-muted-foreground/20 shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear all
              </Button>
            </div>
          )}

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <motion.div 
                  key={notification.id}
                  variants={item}
                  className={`p-4 rounded-xl bg-background border border-border/30 shadow-sm ${!notification.read ? 'ring-1 ring-primary/30' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`${getTypeColor(notification.type)} rounded-full h-10 w-10 flex items-center justify-center text-white flex-shrink-0`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-1 items-center">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.read && (
                            <span className="h-2 w-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      
                      <div className="flex justify-end gap-2 mt-3">
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs rounded-lg"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Mark read
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 text-xs rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-60 py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-primary/50" />
                </div>
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
                  {activeCategory === "all" 
                    ? "You're all caught up! We'll notify you when something new happens."
                    : `No ${activeCategory} notifications available right now.`}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
