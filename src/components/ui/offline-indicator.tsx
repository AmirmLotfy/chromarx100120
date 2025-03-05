
import React from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className, 
  showLabel = true 
}) => {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-md border border-amber-200 dark:border-amber-500/30",
      className
    )}>
      <WifiOff className="h-4 w-4" />
      {showLabel && <span className="text-sm font-medium">Offline</span>}
    </div>
  );
};

export default OfflineIndicator;
