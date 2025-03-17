
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { useBackgroundProcessing } from '@/hooks/useBackgroundProcessing';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DemoItem {
  id: number;
  name: string;
  data: string;
}

interface ProcessedItem extends DemoItem {
  processed: boolean;
  result: string;
}

export const BackgroundProcessingDemo = () => {
  const [items, setItems] = useState<DemoItem[]>([]);
  const [results, setResults] = useState<ProcessedItem[]>([]);
  const [useBackground, setUseBackground] = useState(false);
  
  const { isOffline } = useOfflineStatus();
  
  // Generate sample data
  const generateItems = (count: number = 100) => {
    const newItems: DemoItem[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push({
        id: i,
        name: `Item ${i}`,
        data: `Sample data for item ${i} that needs processing`
      });
    }
    setItems(newItems);
    setResults([]);
  };
  
  // Processing steps for demo
  const processingSteps = [
    "Preparing data",
    "Processing text content",
    "Analyzing patterns",
    "Applying transformations",
    "Finalizing results"
  ];
  
  // Hook for background processing
  const {
    processItems,
    isProcessing,
    progress,
    currentItem,
    totalItems,
    currentStepIndex,
    currentStepLabel,
    cancelProcessing,
    backgroundTasks,
    refreshBackgroundTasks,
    triggerBackgroundProcessing
  } = useBackgroundProcessing<DemoItem>();
  
  // Function to process a single item
  const processItem = useCallback(async (item: DemoItem, index: number): Promise<void> => {
    // Simulate processing time that varies by item
    const processingTime = 50 + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error(`Random failure processing item ${item.id}`);
    }
    
    // Update results array
    setResults(prev => [
      ...prev, 
      {
        ...item,
        processed: true,
        result: `Processed result for ${item.name}`
      }
    ]);
  }, []);
  
  // Start the processing
  const handleStartProcessing = async () => {
    if (items.length === 0) {
      generateItems(50);
      return;
    }
    
    setResults([]);
    
    await processItems({
      items,
      processInBackground: useBackground,
      batchSize: 10,
      pauseBetweenBatches: 100,
      stepLabels: processingSteps,
      processingCallback: processItem,
      onBatchComplete: (processed, total) => {
        console.log(`Processed ${processed} of ${total} items`);
      },
      onComplete: () => {
        toast.success('Processing complete!');
      },
      onError: (error, item) => {
        console.error(`Error processing item ${item.id}:`, error);
      }
    });
  };
  
  return (
    <div className="space-y-6 p-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Background Processing Demo</h2>
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="use-background"
            checked={useBackground}
            onCheckedChange={setUseBackground}
          />
          <Label htmlFor="use-background">Process in background (Service Worker)</Label>
          
          {isOffline && (
            <Badge variant="destructive" className="ml-auto">Offline</Badge>
          )}
        </div>
        
        <div className="flex space-x-4 mb-6">
          <Button 
            onClick={() => generateItems(20)} 
            variant="outline"
            disabled={isProcessing}
          >
            Generate 20 Items
          </Button>
          
          <Button 
            onClick={() => generateItems(100)} 
            variant="outline"
            disabled={isProcessing}
          >
            Generate 100 Items
          </Button>
          
          <Button 
            onClick={handleStartProcessing}
            disabled={isProcessing}
          >
            {useBackground ? 'Start Background Processing' : 'Start Processing'}
          </Button>
          
          {isProcessing && !useBackground && (
            <Button 
              onClick={cancelProcessing}
              variant="destructive"
            >
              Cancel
            </Button>
          )}
        </div>
        
        {isProcessing && !useBackground && (
          <div className="mb-6">
            <ProgressIndicator 
              progress={progress}
              message={`Processing items (${currentItem}/${totalItems}): ${currentStepLabel}`}
              status="loading"
              variant="gradient"
              animated
              showValue
            />
          </div>
        )}
        
        <Tabs defaultValue="data" className="mt-6">
          <TabsList>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="tasks">Background Tasks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="data" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Source Items ({items.length})</h3>
                <div className="border rounded-md h-60 overflow-y-auto p-2">
                  {items.map(item => (
                    <div key={item.id} className="text-sm p-2 border-b">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">{item.data}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Processed Results ({results.length})</h3>
                <div className="border rounded-md h-60 overflow-y-auto p-2">
                  {results.map(item => (
                    <div key={item.id} className="text-sm p-2 border-b">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-green-600">{item.result}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-4">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Background Tasks ({backgroundTasks.length})</h3>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={refreshBackgroundTasks}>
                  Refresh
                </Button>
                <Button size="sm" onClick={triggerBackgroundProcessing}>
                  Process Tasks
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retries</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backgroundTasks.length > 0 ? (
                    backgroundTasks.map(task => (
                      <tr key={task.id}>
                        <td className="px-4 py-2 text-xs">{task.id.substring(0, 8)}...</td>
                        <td className="px-4 py-2 text-xs">{task.type}</td>
                        <td className="px-4 py-2 text-xs">
                          <Badge variant={
                            task.status === 'completed' ? 'success' :
                            task.status === 'failed' ? 'destructive' :
                            task.status === 'processing' ? 'default' : 'outline'
                          }>
                            {task.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {new Date(task.added).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-xs">{task.retries}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        No background tasks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default BackgroundProcessingDemo;
