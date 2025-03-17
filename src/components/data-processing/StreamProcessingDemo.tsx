
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useDataStreamProcessing } from '@/hooks/useDataStreamProcessing';

interface DemoItem {
  id: number;
  name: string;
  data: string;
}

interface ProcessedItem extends DemoItem {
  processed: boolean;
  result: string;
}

export const StreamProcessingDemo = () => {
  const [items, setItems] = useState<DemoItem[]>([]);
  const [results, setResults] = useState<ProcessedItem[]>([]);
  
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
  
  // Hook for data stream processing
  const {
    isProcessing,
    progress,
    currentItem,
    totalItems,
    currentStepIndex,
    currentStepLabel,
    processItems,
    cancelProcessing
  } = useDataStreamProcessing<DemoItem, ProcessedItem>();
  
  // Function to process a single item
  const processItem = async (item: DemoItem, index: number): Promise<ProcessedItem> => {
    // Simulate processing time that varies by item
    const processingTime = 50 + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error(`Random failure processing item ${item.id}`);
    }
    
    return {
      ...item,
      processed: true,
      result: `Processed result for ${item.name}`
    };
  };
  
  // Start the processing
  const handleStartProcessing = async () => {
    if (items.length === 0) {
      generateItems(100);
      return;
    }
    
    const { success, results: processedItems } = await processItems(
      items,
      processItem,
      {
        batchSize: 10,
        pauseBetweenBatches: 100,
        stepLabels: processingSteps,
        preserveOrder: true,
        retryCount: 2,
        maxConcurrent: 5
      }
    );
    
    if (success) {
      setResults(processedItems);
    }
  };
  
  return (
    <div className="space-y-6 p-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Data Stream Processing Demo</h2>
        
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
            Start Processing
          </Button>
          
          {isProcessing && (
            <Button 
              onClick={cancelProcessing}
              variant="destructive"
            >
              Cancel
            </Button>
          )}
        </div>
        
        {isProcessing && (
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
      </Card>
      
      {isProcessing && (
        <LoadingOverlay
          isLoading={isProcessing}
          message={currentStepLabel || "Processing data..."}
          progress={progress}
          variant="progress"
          steps={processingSteps}
          currentStep={currentStepIndex}
          onCancel={cancelProcessing}
        />
      )}
    </div>
  );
};

export default StreamProcessingDemo;
