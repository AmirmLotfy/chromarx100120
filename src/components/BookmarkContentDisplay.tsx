import { cn } from "@/lib/utils";

interface BookmarkContentDisplayProps {
  title?: string;
  url?: string;
  className?: string;
}

const BookmarkContentDisplay = ({ title, url, className }: BookmarkContentDisplayProps) => {
  return (
    <div className={cn("space-y-0.5", className)}>
      {title && (
        <h3 className="font-medium text-sm leading-tight truncate">
          {title}
        </h3>
      )}
      {url && (
        <p className="text-xs text-muted-foreground truncate">
          {url}
        </p>
      )}
    </div>
  );
};

export default BookmarkContentDisplay;