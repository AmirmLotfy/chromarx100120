
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/utils/i18n";

export function SubscriptionStatusOfflineIndicator() {
  const { isOffline, refreshSubscription } = useSubscription();
  
  if (!isOffline) return null;
  
  return (
    <div className="p-2 my-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-amber-800">
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 text-sm">
        You're currently offline. Some subscription features may be limited.
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 text-xs border-amber-300 hover:bg-amber-100"
        onClick={() => refreshSubscription()}
      >
        <RefreshCw className="h-3 w-3" />
        Try again
      </Button>
    </div>
  );
}
