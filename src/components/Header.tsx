import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, User, LogOut, Menu, Bell } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "bookmarks" | "system" | "reminders";
  timestamp: string;
  read: boolean;
}

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationDot, setShowNotificationDot] = useState(false);

  useEffect(() => {
    const demoNotifications: Notification[] = [
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
    
    setNotifications(demoNotifications);
    setShowNotificationDot(demoNotifications.some(n => !n.read));
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme} mode`, {
      duration: 2000,
      className: "theme-toggle-toast",
    });
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
    
    const hasUnread = notifications.some(n => !n.read && n.id !== id);
    setShowNotificationDot(hasUnread);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setShowNotificationDot(false);
    toast.success("All notifications marked as read");
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bookmarks": return "bg-blue-500";
      case "reminders": return "bg-amber-500";
      case "system": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40 py-2.5 px-4"
        role="banner"
        aria-label="Application header"
      >
        <div className="container h-full max-w-screen-xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-full gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/lovable-uploads/c57439a4-ac35-4ae6-ac00-dd8f5ef8a360.png" 
                alt="ChroMarx Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            
            {isMobile ? (
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 rounded-full p-0 relative"
                      aria-label="Notifications"
                    >
                      <Bell className="h-[1.1rem] w-[1.1rem]" />
                      {showNotificationDot && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[calc(100vw-32px)] max-w-[320px] p-0 border border-border/60 shadow-lg bg-background"
                    align="end"
                    sideOffset={8}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted">
                      <h3 className="font-medium text-sm flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-primary/70" />
                        Notifications
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs py-0 h-5">
                            {unreadCount} new
                          </Badge>
                        )}
                      </h3>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 text-xs font-normal"
                          onClick={markAllAsRead}
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                    
                    <ScrollArea className="h-[280px] overflow-hidden bg-background">
                      {notifications.length > 0 ? (
                        <div className="py-1">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={`px-4 py-2.5 hover:bg-muted transition-colors ${!notification.read ? 'bg-accent/10' : ''}`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex gap-3">
                                <div className={`${getTypeColor(notification.type)} w-1 rounded-full flex-shrink-0`} />
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <p className="text-sm font-medium truncate pr-1 flex items-center gap-1.5">
                                      {notification.title}
                                      {!notification.read && (
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                                      )}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                      {formatTime(notification.timestamp)}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                          <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground">No notifications</p>
                        </div>
                      )}
                    </ScrollArea>
                    
                    <div className="px-4 py-2.5 border-t border-border/40 bg-muted/50">
                      <Link 
                        to="/notifications"
                        className="flex items-center justify-center text-xs font-medium text-primary hover:underline gap-1"
                        onClick={() => document.body.click()} // Close the popover
                      >
                        View all notifications
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 rounded-full p-0"
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={toggleMenu}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 rounded-full p-0 relative"
                      aria-label="Notifications"
                    >
                      <Bell className="h-[1.1rem] w-[1.1rem]" />
                      {showNotificationDot && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[320px] p-0 border border-border/60 shadow-lg bg-background"
                    align="end"
                    sideOffset={8}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted">
                      <h3 className="font-medium text-sm flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-primary/70" />
                        Notifications
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs py-0 h-5">
                            {unreadCount} new
                          </Badge>
                        )}
                      </h3>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 text-xs font-normal"
                          onClick={markAllAsRead}
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                    
                    <ScrollArea className="h-[280px] overflow-hidden bg-background">
                      {notifications.length > 0 ? (
                        <div className="py-1">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={`px-4 py-2.5 hover:bg-muted transition-colors ${!notification.read ? 'bg-accent/10' : ''}`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex gap-3">
                                <div className={`${getTypeColor(notification.type)} w-1 rounded-full flex-shrink-0`} />
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <p className="text-sm font-medium truncate pr-1 flex items-center gap-1.5">
                                      {notification.title}
                                      {!notification.read && (
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                                      )}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                      {formatTime(notification.timestamp)}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                          <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground">No notifications</p>
                        </div>
                      )}
                    </ScrollArea>
                    
                    <div className="px-4 py-2.5 border-t border-border/40 bg-muted/50">
                      <Link 
                        to="/notifications"
                        className="flex items-center justify-center text-xs font-medium text-primary hover:underline gap-1"
                        onClick={() => document.body.click()} // Close the popover
                      >
                        View all notifications
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {user ? (
                  <div className="flex items-center gap-2">
                    <Link to="/user">
                      <Button variant="ghost" size="sm" className="gap-1 h-8 rounded-full">
                        <User className="h-4 w-4" />
                        <span className="hidden md:inline">{user.email?.split('@')[0] || 'Account'}</span>
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => signOut()}
                      aria-label="Sign out"
                      title="Sign out"
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button size="sm" variant="outline" className="gap-1 rounded-full h-8">
                      <User className="h-4 w-4" />
                      <span>Sign In</span>
                    </Button>
                  </Link>
                )}
                
                <div className="flex items-center gap-2">
                  <LanguageSelector />
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8 rounded-full transition-colors hover:bg-accent"
                  >
                    <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[3.5rem] left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 shadow-lg"
          >
            <div className="container py-3 px-4 space-y-3">
              {user ? (
                <>
                  <Link to="/user" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.email?.split('@')[0] || 'Account'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="h-px bg-border/50 my-2" />
                  
                  <button 
                    className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-accent/10"
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <LogOut className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="text-sm">Sign Out</span>
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Sign In</span>
                  </div>
                </Link>
              )}
              
              <div className="h-px bg-border/50 my-2" />
              
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/10">
                <span className="text-sm">Language</span>
                <LanguageSelector />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
