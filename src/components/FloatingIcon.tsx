import { useState, useEffect } from "react";
import { Bell, X, Menu } from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: 'timer' | 'reminder' | 'other';
  message: string;
  timestamp: number;
}

export const FloatingIcon = () => {
  const { toggleSidebar, state } = useSidebar();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  // Listen for notifications from chrome.runtime
  useEffect(() => {
    const handleNotification = (notification: Notification) => {
      setNotifications(prev => [...prev, notification]);
    };

    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'notification') {
          handleNotification(message.notification);
        }
      });
    }

    // Register keyboard shortcut
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [toggleSidebar]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2",
        "transition-transform duration-200 ease-in-out",
        isHovered && "scale-105"
      )}
    >
      {notifications.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearNotifications}
          className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          Clear all
        </Button>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full shadow-lg",
                "bg-primary hover:bg-primary/90",
                "transition-all duration-200 ease-in-out",
                "relative"
              )}
              onClick={toggleSidebar}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {state === "expanded" ? (
                <X className="h-5 w-5 text-primary-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-primary-foreground" />
              )}
              
              {notifications.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notifications.length}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{state === "expanded" ? "Close sidebar" : "Open sidebar"}</p>
            {notifications.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};