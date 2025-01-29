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
      if (!("Notification" in window)) return;

      try {
        // Request permission if not granted
        if (notificationPermission === "default") {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
        }
        
        if (notificationPermission === "granted") {
          // Update unread count
          setUnreadCount(prev => prev + newBookmarks.length);

          // Show notifications for each new bookmark
          newBookmarks.forEach(bookmark => {
            // Create browser notification
            new Notification("New Bookmark Added", {
              body: `${bookmark.title}\n${bookmark.url}`,
              icon: "/icon48.png",
              tag: bookmark.id,
              badge: "/icon48.png",
              requireInteraction: false,
              silent: false,
              vibrate: [200, 100, 200]
            });

            // Show toast notification
            toast.success(`New bookmark added: ${bookmark.title}`, {
              description: bookmark.url,
              duration: 3000,
              action: {
                label: "View",
                onClick: () => {
                  // Scroll to the bookmark or highlight it
                  const element = document.getElementById(bookmark.id);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                    element.classList.add("highlight");
                    setTimeout(() => element.classList.remove("highlight"), 2000);
                  }
                }
              }
            });
          });

          // Store unread count in chrome.storage
          if (chrome.storage) {
            chrome.storage.local.set({ unreadBookmarks: unreadCount });
          }
        }
      } catch (error) {
        console.error("Error showing notification:", error);
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
        chrome.storage.local.set({ unreadBookmarks: 0 });
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