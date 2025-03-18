
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { processBookmarksWithStreams, streamBookmarksFromDB } from '@/utils/bookmarkStreamProcessor';
import { getWithExpiration, storeWithExpiration, clearStorage } from '@/utils/chromeStorageUtils';
import { serviceWorkerController } from '@/services/serviceWorkerController';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RefreshCw, Database, Trash } from 'lucide-react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  tags?: string[];
  processed?: boolean;
  processedAt?: string;
  transformedAt?: string;
  transformedBy?: string;
}

export function BookmarkStreamProcessingDemo() {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [storedBookmarks, setStoredBookmarks] = useState<Bookmark[]>([]);
  const [isLoadingStored, setIsLoadingStored] = useState(false);
  
  // Get stored bookmarks on component mount
  useEffect(() => {
    loadStoredBookmarks();
  }, []);
  
  // Load bookmarks from storage
  const loadStoredBookmarks = async () => {
    setIsLoadingStored(true);
    
    try {
      const bookmarks = await getWithExpiration<Bookmark[]>('demo_processed_bookmarks') || [];
      setStoredBookmarks(bookmarks);
      setProcessedCount(bookmarks.length);
    } catch (error) {
      console.error('Error loading stored bookmarks:', error);
    } finally {
      setIsLoadingStored(false);
    }
  };
  
  // Process sample bookmarks with streams and store using our optimized storage
  const processBookmarks = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Generate sample bookmarks
      const sampleBookmarks: Bookmark[] = Array.from({ length: 50 }, (_, i) => ({
        id: `bookmark-${i}`,
        title: `Bookmark ${i}`,
        url: `https://example.com/page${i}`,
        tags: i % 2 === 0 ? ['sample', 'even'] : ['sample', 'odd']
      }));
      
      // Choose whether to process in service worker or directly
      const useServiceWorker = Math.random() > 0.5;
      
      if (useServiceWorker && serviceWorkerController.isReady()) {
        // Process in service worker background
        toast.info('Processing bookmarks in service worker...');
        
        const taskId = await serviceWorkerController.scheduleTask('BOOKMARK_PROCESSING', {
          bookmarks: sampleBookmarks
        }, 'high');
        
        if (taskId) {
          // Task scheduled successfully
          const handleTaskUpdate = (data: any) => {
            if (data.taskId === taskId) {
              setProgress(data.progress || 0);
              
              if (data.status === 'completed') {
                setProcessedCount(data.result?.processedCount || 0);
                setStoredBookmarks(data.result?.bookmarks || []);
                setIsProcessing(false);
                toast.success(`Successfully processed ${data.result?.processedCount || 0} bookmarks`);
                
                // Store the processed bookmarks
                storeWithExpiration(
                  'demo_processed_bookmarks', 
                  data.result?.bookmarks || [], 
                  24 * 60 * 60 * 1000
                );
                
                // Unsubscribe from updates
                unsubscribe();
              }
            }
          };
          
          // Subscribe to task updates
          const unsubscribe = serviceWorkerController.subscribe('TASK_STATUS_UPDATE', handleTaskUpdate);
          
          // Also trigger background processing to start immediately
          serviceWorkerController.sendMessage({ type: 'PROCESS_TASKS' });
        } else {
          toast.error('Failed to schedule background processing');
          setIsProcessing(false);
        }
      } else {
        // Process directly with streams
        const processedBookmarks = await processBookmarksWithStreams(
          sampleBookmarks,
          async (bookmark) => {
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
              ...bookmark,
              processed: true,
              processedAt: new Date().toISOString()
            };
          },
          {
            batchSize: 5,
            onProgress: (p) => setProgress(p * 100),
            shouldStore: false // We'll handle storage ourselves
          }
        );
        
        // Store with better chrome.storage integration
        await storeWithExpiration(
          'demo_processed_bookmarks', 
          processedBookmarks, 
          24 * 60 * 60 * 1000
        );
        
        setProcessedCount(processedBookmarks.length);
        setStoredBookmarks(processedBookmarks);
        toast.success(`Successfully processed ${processedBookmarks.length} bookmarks`);
      }
    } catch (error) {
      console.error('Error processing bookmarks:', error);
      toast.error('Failed to process bookmarks');
    } finally {
      if (!serviceWorkerController.isReady()) {
        setIsProcessing(false);
      }
    }
  };
  
  // Retrieve and transform data from storage using streams
  const retrieveProcessed = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const bookmarks = await getWithExpiration<Bookmark[]>('demo_processed_bookmarks') || [];
      
      if (bookmarks.length === 0) {
        toast.info('No bookmarks found in storage');
        setIsProcessing(false);
        return;
      }
      
      const transformedBookmarks = await streamBookmarksFromDB(
        'demo_processed_bookmarks',
        async (bookmark: any) => {
          // Simulate transformation time
          await new Promise(resolve => setTimeout(resolve, 50));
          return {
            ...bookmark,
            transformedAt: new Date().toISOString(),
            transformedBy: 'BookmarkStreamProcessor'
          };
        },
        {
          onProgress: (p) => setProgress(p * 100)
        }
      );
      
      // Update the stored bookmarks with transformed ones
      await storeWithExpiration(
        'demo_processed_bookmarks', 
        transformedBookmarks, 
        24 * 60 * 60 * 1000
      );
      
      setProcessedCount(transformedBookmarks.length);
      setStoredBookmarks(transformedBookmarks);
      toast.success(`Retrieved and transformed ${transformedBookmarks.length} bookmarks`);
    } catch (error) {
      console.error('Error retrieving bookmarks:', error);
      toast.error('Failed to retrieve bookmarks');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Clear demo data
  const clearData = async () => {
    try {
      await clearStorage();
      setProcessedCount(0);
      setStoredBookmarks([]);
      toast.success('Cleared all demo bookmark data');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Stream Processing with Service Worker
        </CardTitle>
        <CardDescription>
          Demonstrates efficient bookmark processing using Streams API with service worker orchestration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
        
        {storedBookmarks.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <div className="bg-secondary/20 p-3 font-medium text-sm flex justify-between items-center">
              <span>Stored Bookmarks ({storedBookmarks.length})</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={loadStoredBookmarks}
                disabled={isLoadingStored}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingStored ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y">
              {storedBookmarks.slice(0, 5).map((bookmark) => (
                <div key={bookmark.id} className="p-3 text-sm">
                  <div className="font-medium">{bookmark.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {bookmark.url}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {bookmark.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {bookmark.processed && (
                      <Badge variant="secondary" className="text-xs">
                        processed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {storedBookmarks.length > 5 && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  {storedBookmarks.length - 5} more bookmarks...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2 flex-wrap">
        <Button 
          onClick={processBookmarks} 
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Process Sample Bookmarks
        </Button>
        <Button 
          onClick={retrieveProcessed} 
          disabled={isProcessing} 
          variant="outline"
        >
          Retrieve & Transform
        </Button>
        <Button 
          onClick={clearData} 
          disabled={isProcessing} 
          variant="destructive"
          size="icon"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default BookmarkStreamProcessingDemo;
