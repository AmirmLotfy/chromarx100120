import { useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";

interface BookmarkNotificationsProps {
  newBookmarks: ChromeBookmark[];
}

const BookmarkNotifications = ({ newBookmarks }: BookmarkNotificationsProps) => {
  useEffect(() => {
    const showNotifications = async () => {
      if (!("Notification" in window)) return;

      try {
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          newBookmarks.forEach(bookmark => {
            new Notification("New Bookmark Added", {
              body: `${bookmark.title}\n${bookmark.url}`,
              icon: "/icon48.png",
              tag: bookmark.id,
              badge: "/icon48.png",
              vibrate: [200, 100, 200],
              requireInteraction: false,
              silent: false
            });

            toast.success(`New bookmark added: ${bookmark.title}`, {
              description: bookmark.url,
              duration: 3000,
            });
          });
        }
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    };

    if (newBookmarks.length > 0) {
      showNotifications();
    }
  }, [newBookmarks]);

  return null;
};

export default BookmarkNotifications;