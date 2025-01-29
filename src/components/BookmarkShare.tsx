import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChromeBookmark } from "@/types/bookmark";

interface BookmarkShareProps {
  bookmark: ChromeBookmark;
}

const BookmarkShare = ({ bookmark }: BookmarkShareProps) => {
  const [open, setOpen] = useState(false);

  const handleShare = async () => {
    try {
      if (!bookmark.url) {
        throw new Error("No URL to share");
      }

      await navigator.share({
        title: bookmark.title,
        text: `Check out this bookmark: ${bookmark.title}`,
        url: bookmark.url,
      });

      toast.success("Bookmark shared successfully!");
      setOpen(false);
    } catch (error) {
      // Fallback to clipboard if Web Share API is not available
      if (error instanceof Error && error.name === "NotSupportedError") {
        await navigator.clipboard.writeText(bookmark.url);
        toast.success("Bookmark URL copied to clipboard!");
        setOpen(false);
      } else {
        toast.error("Failed to share bookmark");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Bookmark</DialogTitle>
          <DialogDescription>
            Share this bookmark with others
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Title</h4>
            <Input value={bookmark.title} readOnly />
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">URL</h4>
            <Input value={bookmark.url} readOnly />
          </div>
          <Button onClick={handleShare} className="w-full">
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkShare;