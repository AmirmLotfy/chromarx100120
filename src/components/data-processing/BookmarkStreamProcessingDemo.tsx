
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { processBookmarksWithStreams, streamBookmarksFromDB } from '@/utils/bookmarkStreamProcessor';
import { storage } from '@/services/storage';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  tags?: string[];
}

export function BookmarkStreamProcessingDemo() {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  
  // Process sample bookmarks with streams and store in IndexedDB
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
      
      // Process with streams and store in IndexedDB
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
          storageKey: 'demo_processed_bookmarks',
          onProgress: (p) => setProgress(p * 100)
        }
      );
      
      setProcessedCount(processedBookmarks.length);
      toast.success(`Successfully processed ${processedBookmarks.length} bookmarks`);
    } catch (error) {
      console.error('Error processing bookmarks:', error);
      toast.error('Failed to process bookmarks');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Retrieve and transform data from IndexedDB using streams
  const retrieveProcessed = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const transformedBookmarks = await streamBookmarksFromDB(
        'demo_processed_bookmarks',
        async (bookmark: any) => {
          // Simulate transformation time
          await new Promise(resolve => setTimeout(resolve, 50));
          return {
            ...bookmark,
            transformedAt: new Date().toISOString()
          };
        },
        {
          onProgress: (p) => setProgress(p * 100)
        }
      );
      
      setProcessedCount(transformedBookmarks.length);
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
      await storage.remove('demo_processed_bookmarks');
      setProcessedCount(0);
      toast.success('Cleared all demo bookmark data');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Stream Processing with IndexedDB Integration</CardTitle>
        <CardDescription>
          Demonstrates efficient bookmark processing using Streams API with direct IndexedDB integration
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
        
        {processedCount > 0 && (
          <div className="p-4 bg-muted rounded-md">
            <p className="font-medium">Results</p>
            <p className="text-sm text-muted-foreground">
              Successfully processed {processedCount} bookmarks
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2 flex-wrap">
        <Button onClick={processBookmarks} disabled={isProcessing}>
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
        >
          Clear Data
        </Button>
      </CardFooter>
    </Card>
  );
}

export default BookmarkStreamProcessingDemo;
