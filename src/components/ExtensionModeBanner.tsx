
import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { storage } from '@/services/storageService';
import { toast } from 'sonner';

const ExtensionModeBanner = () => {
  const [isExtension, setIsExtension] = useState(false);
  
  useEffect(() => {
    // Check if we're running in a Chrome extension context
    const inExtension = typeof chrome !== 'undefined' && 
                       !!chrome.storage && 
                       !!chrome.storage.sync;
    setIsExtension(inExtension);
    
    // If not in extension mode, populate test data automatically on first load
    if (!inExtension) {
      storage.populateTestData().catch(err => {
        console.error('Error populating test data:', err);
      });
    }
  }, []);
  
  const refreshTestData = async () => {
    try {
      await storage.clearCache();
      await storage.populateTestData();
      toast.success('Test data refreshed!');
    } catch (error) {
      toast.error('Failed to refresh test data');
      console.error('Error refreshing test data:', error);
    }
  };
  
  if (isExtension) {
    return null; // Don't show anything in real extension
  }
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Web Preview Mode</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          You're viewing this Chrome extension in web preview mode. Some features may not work properly.
          Test data has been populated automatically.
        </p>
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={refreshTestData}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Test Data
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ExtensionModeBanner;
