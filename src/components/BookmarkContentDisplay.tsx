import { cn } from "@/lib/utils";

interface BookmarkContentDisplayProps {
  title?: string;
  url?: string;
  className?: string;
}

const BookmarkContentDisplay = ({ title, url, className }: BookmarkContentDisplayProps) => {
  return (
    <div className={cn("space-y-1", className)}>
      {title && (
        <h3 className="font-medium text-base leading-none truncate">
          {title}
        </h3>
      )}
      {url && (
        <p className="text-sm text-muted-foreground truncate">
          {url}
        </p>
      )}
    </div>
  );
};

export default BookmarkContentDisplay;