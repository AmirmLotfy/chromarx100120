
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { unifiedCache } from '@/utils/unifiedCacheManager';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(unifiedCache.isInOfflineMode());
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleCacheManagerOnline = () => setIsOffline(false);
    const handleCacheManagerOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('cache-manager-online', handleCacheManagerOnline);
    window.addEventListener('cache-manager-offline', handleCacheManagerOffline);
    
    // Set initial state
    setIsOffline(unifiedCache.isInOfflineMode() || !navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('cache-manager-online', handleCacheManagerOnline);
      window.removeEventListener('cache-manager-offline', handleCacheManagerOffline);
    };
  }, []);
  
  if (!isOffline) {
    return null;
  }
  
  return (
    <Badge 
      variant="outline" 
      className="flex items-center gap-1 bg-yellow-100/30 text-yellow-900 border-yellow-300"
    >
      <WifiOff className="h-3 w-3" />
      <span>Offline</span>
    </Badge>
  );
}

export default OfflineIndicator;
