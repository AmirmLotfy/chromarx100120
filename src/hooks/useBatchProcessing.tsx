
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface BatchProcessingOptions<T> {
  items: T[];
  batchSize?: number;
  processingCallback: (item: T, index: number) => Promise<void>;
  onBatchComplete?: (processedItems: number, totalItems: number) => void;
  onComplete?: () => void;
  onError?: (error: Error, item: T) => void;
  onProgress?: (progress: number) => void;
  pauseBetweenBatches?: number;
  stepLabels?: string[];
}

export function useBatchProcessing<T>() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentStepLabel, setCurrentStepLabel] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProgress = useCallback((processed: number, total: number) => {
    const newProgress = Math.floor((processed / total) * 100);
    setProgress(newProgress);
    setCurrentItem(processed);
  }, []);

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      toast.info("Processing canceled");
      setIsProcessing(false);
    }
  }, []);

  const setProcessingStep = useCallback((index: number, steps?: string[]) => {
    setCurrentStepIndex(index);
    if (steps && index < steps.length) {
      setCurrentStepLabel(steps[index]);
    }
  }, []);

  const processBatch = useCallback(
    async ({
      items,
      batchSize = 5,
      processingCallback,
      onBatchComplete,
      onComplete,
      onError,
      onProgress,
      pauseBetweenBatches = 0,
      stepLabels,
    }: BatchProcessingOptions<T>) => {
      if (isProcessing) {
        toast.warning('Processing is already in progress');
        return;
      }

      if (!items.length) {
        toast.warning('No items to process');
        return;
      }

      // Create a new abort controller
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setIsProcessing(true);
      setProgress(0);
      setCurrentItem(0);
      setTotalItems(items.length);
      setCurrentStepIndex(0);
      
      if (stepLabels && stepLabels.length > 0) {
        setCurrentStepLabel(stepLabels[0]);
      }

      try {
        for (let i = 0; i < items.length; i += batchSize) {
          // Check if processing was canceled
          if (signal.aborted) {
            break;
          }

          const batch = items.slice(i, i + batchSize);
          const batchPromises = batch.map(async (item, batchIndex) => {
            // Check if processing was canceled before each item
            if (signal.aborted) {
              return;
            }
            
            const itemIndex = i + batchIndex;
            setCurrentItem(itemIndex + 1);
            
            try {
              await processingCallback(item, itemIndex);
            } catch (error) {
              console.error(`Error processing item at index ${itemIndex}:`, error);
              if (!signal.aborted) { // Only call onError if not aborted
                onError?.(error as Error, item);
              }
            }
          });

          await Promise.all(batchPromises);
          
          if (signal.aborted) {
            break;
          }
          
          const processedItems = Math.min(i + batchSize, items.length);
          const newProgress = Math.floor((processedItems / items.length) * 100);
          setProgress(newProgress);
          
          // Call both progress callbacks
          onProgress?.(newProgress);
          onBatchComplete?.(processedItems, items.length);
          
          // Pause between batches if specified
          if (pauseBetweenBatches > 0 && i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, pauseBetweenBatches));
          }
          
          // Update step if stepLabels provided and we're at calculated step points
          if (stepLabels && stepLabels.length > 1) {
            const stepProgress = Math.floor((processedItems / items.length) * stepLabels.length);
            if (stepProgress !== currentStepIndex && stepProgress < stepLabels.length) {
              setProcessingStep(stepProgress, stepLabels);
            }
          }
        }

        if (!signal.aborted) {
          onComplete?.();
        }
      } catch (error) {
        console.error('Batch processing failed:', error);
        toast.error('Processing failed');
      } finally {
        if (!signal.aborted) { // Only reset state if not already canceled
          setIsProcessing(false);
        }
      }
    },
    [isProcessing, currentStepIndex, setProcessingStep]
  );

  return {
    processBatch,
    isProcessing,
    progress,
    currentItem,
    totalItems,
    cancelProcessing,
    setProcessingStep,
    currentStepIndex,
    currentStepLabel,
  };
}
