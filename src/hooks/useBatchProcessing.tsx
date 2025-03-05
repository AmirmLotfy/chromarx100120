
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface BatchProcessingOptions<T> {
  items: T[];
  batchSize?: number;
  processingCallback: (item: T, index: number) => Promise<void>;
  onBatchComplete?: (processedItems: number, totalItems: number) => void;
  onComplete?: () => void;
  onError?: (error: Error, item: T) => void;
}

export function useBatchProcessing<T>() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);

  const processBatch = useCallback(
    async ({
      items,
      batchSize = 5,
      processingCallback,
      onBatchComplete,
      onComplete,
      onError,
    }: BatchProcessingOptions<T>) => {
      if (isProcessing) {
        toast.warning('Processing is already in progress');
        return;
      }

      if (!items.length) {
        toast.warning('No items to process');
        return;
      }

      setIsProcessing(true);
      setProgress(0);
      setCurrentItem(0);
      setTotalItems(items.length);

      try {
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const batchPromises = batch.map(async (item, batchIndex) => {
            const itemIndex = i + batchIndex;
            setCurrentItem(itemIndex + 1);
            
            try {
              await processingCallback(item, itemIndex);
            } catch (error) {
              console.error(`Error processing item at index ${itemIndex}:`, error);
              onError?.(error as Error, item);
            }
          });

          await Promise.all(batchPromises);
          
          const processedItems = Math.min(i + batchSize, items.length);
          const newProgress = Math.floor((processedItems / items.length) * 100);
          setProgress(newProgress);
          
          onBatchComplete?.(processedItems, items.length);
        }

        onComplete?.();
      } catch (error) {
        console.error('Batch processing failed:', error);
        toast.error('Processing failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing]
  );

  return {
    processBatch,
    isProcessing,
    progress,
    currentItem,
    totalItems,
  };
}
