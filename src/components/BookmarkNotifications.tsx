import { useEffect, useState } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Badge } from "./ui/badge";

interface BookmarkNotificationsProps {
  newBookmarks: ChromeBookmark[];
}

const BookmarkNotifications = ({ newBookmarks }: BookmarkNotificationsProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Check notification permission on mount
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const showNotifications = async () => {
      if (!("Notification" in window)) {
        console.log("Notifications not supported");
        return;
      }

      try {
        // Request permission if not granted
        if (notificationPermission === "default") {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          if (permission !== "granted") {
            console.log("Notification permission denied");
            return;
          }
        }
        
        if (notificationPermission === "granted") {
          // Update unread count
          setUnreadCount(prev => prev + newBookmarks.length);

          // Show notifications for each new bookmark
          newBookmarks.forEach(bookmark => {
            // Create browser notification with proper error handling
            try {
              new Notification("New Bookmark Added", {
                body: `${bookmark.title}\n${bookmark.url}`,
                icon: "/lovable-uploads/95959624-8b98-4a44-b8d1-393d07c243bc.png",
                tag: bookmark.id,
                badge: "/lovable-uploads/95959624-8b98-4a44-b8d1-393d07c243bc.png",
                requireInteraction: false,
                silent: false
              });

              // Show toast notification
              toast.success(`New bookmark added: ${bookmark.title}`, {
                description: bookmark.url,
                duration: 3000,
                action: {
                  label: "View",
                  onClick: () => {
                    const element = document.getElementById(bookmark.id);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                      element.classList.add("highlight");
                      setTimeout(() => element.classList.remove("highlight"), 2000);
                    }
                  }
                }
              });
            } catch (error) {
              console.error("Error showing notification:", error);
            }
          });

          // Store unread count in chrome.storage
          if (chrome.storage) {
            chrome.storage.local.set({ unreadBookmarks: unreadCount }).catch(error => {
              console.error("Error storing unread count:", error);
            });
          }
        }
      } catch (error) {
        console.error("Error in notification handling:", error);
      }
    };

    if (newBookmarks.length > 0) {
      showNotifications();
    }
  }, [newBookmarks, notificationPermission]);

  // Clear unread count when component unmounts
  useEffect(() => {
    return () => {
      if (chrome.storage) {
        chrome.storage.local.set({ unreadBookmarks: 0 }).catch(error => {
          console.error("Error clearing unread count:", error);
        });
      }
      setUnreadCount(0);
    };
  }, []);

  if (unreadCount === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Bell className="h-5 w-5 text-primary" />
      <Badge variant="secondary" className="animate-pulse">
        {unreadCount} new
      </Badge>
    </div>
  );
};

export default BookmarkNotifications;