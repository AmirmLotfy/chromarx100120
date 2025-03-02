
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface BookmarkContentDisplayProps {
  title?: string;
  url?: string;
  className?: string;
  favicon?: string;
  description?: string;
  isLoading?: boolean;
}

const BookmarkContentDisplay = ({ 
  title, 
  url, 
  className, 
  favicon,
  description,
  isLoading = false
}: BookmarkContentDisplayProps) => {
  if (isLoading) {
    return (
      <Card className={cn("p-4 space-y-2", className)}>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </Card>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        {favicon && (
          <img 
            src={favicon} 
            alt={`${title} favicon`} 
            className="w-5 h-5 object-contain" 
          />
        )}
        {title && (
          <h3 className="font-medium text-sm leading-tight truncate">
            {title}
          </h3>
        )}
      </div>
      
      {url && (
        <p className="text-xs text-muted-foreground truncate">
          {url}
        </p>
      )}
      
      {description && (
        <p className="text-xs line-clamp-2 text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </div>
  );
};

export default BookmarkContentDisplay;
