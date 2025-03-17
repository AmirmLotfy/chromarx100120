
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useOfflineStatus } from './useOfflineStatus';
import { useOptimizedServiceWorker } from './useOptimizedServiceWorker';
import { v4 as uuidv4 } from 'uuid';

interface BackgroundProcessingOptions<T> {
  items: T[];
  processInBackground?: boolean;
  batchSize?: number;
  processingCallback: (item: T, index: number) => Promise<void>;
  onBatchComplete?: (processedItems: number, totalItems: number) => void;
  onComplete?: () => void;
  onError?: (error: Error, item: T) => void;
  onProgress?: (progress: number) => void;
  pauseBetweenBatches?: number;
  stepLabels?: string[];
  priority?: 'high' | 'normal' | 'low';
  maxRetries?: number;
}

export interface BackgroundTask {
  id: string;
  type: string;
  data: any;
  added: number;
  retries: number;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

// Define a proper type for task callbacks
interface TaskCallbacks {
  onComplete?: () => void;
  onError?: (error: Error, item: any) => void;
  onProgress?: (progress: number) => void;
}

export function useBackgroundProcessing<T>() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentStepLabel, setCurrentStepLabel] = useState<string>("");
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
  const [isSyncingTasks, setSyncingTasks] = useState(false);
  
  const { isOffline } = useOfflineStatus();
  const { registration } = useOptimizedServiceWorker();
  
  const abortControllerRef = useRef<AbortController | null>(null);
  // Update the type of the taskCallbacksRef to use our new interface
  const taskCallbacksRef = useRef<Map<string, TaskCallbacks>>(new Map());

  // Listen for service worker messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (!event.data?.type) return;
      
      switch (event.data.type) {
        case 'BACKGROUND_PROGRESS':
          setProgress(event.data.progress);
          break;
          
        case 'BACKGROUND_COMPLETE':
          toast.success(`Background processing complete: ${event.data.processed} items processed`);
          if (event.data.remaining === 0) {
            setIsProcessing(false);
          }
          break;
          
        case 'BACKGROUND_TASKS':
          setBackgroundTasks(event.data.tasks || []);
          setSyncingTasks(false);
          break;
          
        case 'PROCESS_BATCH':
          // Handle batch processing request from service worker
          const { batchId, items, options } = event.data;
          processBatchLocally(items, options)
            .then(results => {
              // Notify service worker of batch completion
              if (registration?.active) {
                registration.active.postMessage({
                  type: 'BATCH_COMPLETED',
                  batchId,
                  results
                });
              }
            })
            .catch(error => {
              console.error('Error processing batch:', error);
              if (registration?.active) {
                registration.active.postMessage({
                  type: 'BATCH_FAILED',
                  batchId,
                  error: error.message
                });
              }
            });
          break;
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [registration]);
  
  // Fetch background tasks when needed
  const refreshBackgroundTasks = useCallback(() => {
    if (!registration?.active) return;
    
    setSyncingTasks(true);
    registration.active.postMessage({
      type: 'GET_BACKGROUND_TASKS'
    });
  }, [registration]);
  
  // Process a batch locally (in the main thread)
  const processBatchLocally = async (items: any[], options: any = {}) => {
    const results = [];
    const { processingCallback } = options;
    
    if (!processingCallback) {
      throw new Error('No processing callback provided');
    }
    
    for (let i = 0; i < items.length; i++) {
      try {
        const result = await processingCallback(items[i], i);
        results.push({ success: true, index: i, result });
      } catch (error) {
        results.push({ success: false, index: i, error: error.message });
      }
    }
    
    return results;
  };

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
    
    // Also cancel any background tasks
    if (registration?.active) {
      registration.active.postMessage({
        type: 'CANCEL_BACKGROUND_TASKS'
      });
    }
  }, [registration]);

  const setProcessingStep = useCallback((index: number, steps?: string[]) => {
    setCurrentStepIndex(index);
    if (steps && index < steps.length) {
      setCurrentStepLabel(steps[index]);
    }
  }, []);

  const scheduleBackgroundTask = useCallback(async (taskData: Omit<BackgroundTask, 'id' | 'added' | 'retries' | 'status' | 'progress'>) => {
    if (!registration?.active) {
      toast.error('Service worker not available for background processing');
      return null;
    }
    
    const taskId = uuidv4();
    const task: BackgroundTask = {
      id: taskId,
      ...taskData,
      added: Date.now(),
      retries: 0,
      status: 'pending',
      progress: 0
    };
    
    registration.active.postMessage({
      type: 'ADD_BACKGROUND_TASK',
      task
    });
    
    // Refresh the task list
    setTimeout(refreshBackgroundTasks, 500);
    
    return taskId;
  }, [registration, refreshBackgroundTasks]);
  
  // Process items - choose between direct or background processing
  const processItems = useCallback(
    async ({
      items,
      processInBackground = false,
      batchSize = 5,
      processingCallback,
      onBatchComplete,
      onComplete,
      onError,
      onProgress,
      pauseBetweenBatches = 0,
      stepLabels,
      priority = 'normal',
      maxRetries = 3,
    }: BackgroundProcessingOptions<T>) => {
      if (isProcessing) {
        toast.warning('Processing is already in progress');
        return;
      }

      if (!items.length) {
        toast.warning('No items to process');
        return;
      }
      
      // If offline and trying to process in foreground, suggest background processing
      if (isOffline && !processInBackground) {
        const shouldContinueInBackground = window.confirm(
          'You are currently offline. Would you like to queue this task to be processed when you come back online?'
        );
        
        if (shouldContinueInBackground) {
          processInBackground = true;
        } else {
          toast.warning('Processing canceled while offline');
          return;
        }
      }
      
      // Use background processing if requested
      if (processInBackground) {
        if (!registration?.active) {
          toast.error('Service worker not available for background processing');
          return;
        }
        
        // Store the callbacks for later
        const taskId = uuidv4();
        taskCallbacksRef.current.set(taskId, {
          onComplete,
          onError,
          onProgress
        });
        
        // Split items into manageable chunks for background processing
        const chunks = [];
        for (let i = 0; i < items.length; i += batchSize) {
          chunks.push(items.slice(i, i + batchSize));
        }
        
        // Create a background task for each chunk
        const tasks = chunks.map((chunk, index) => ({
          type: 'PROCESS_BATCH',
          data: {
            batchId: `${taskId}-${index}`,
            items: chunk,
            batchIndex: index,
            totalBatches: chunks.length,
            params: { /* Any parameters needed for processing */ }
          },
          priority,
        }));
        
        // Schedule all tasks
        for (const task of tasks) {
          await scheduleBackgroundTask(task);
        }
        
        toast.success(`Scheduled ${tasks.length} batches for background processing`);
        return;
      }
      
      // Otherwise, process in the foreground
      setIsProcessing(true);
      setProgress(0);
      setCurrentItem(0);
      setTotalItems(items.length);
      setCurrentStepIndex(0);
      
      if (stepLabels && stepLabels.length > 0) {
        setCurrentStepLabel(stepLabels[0]);
      }
      
      // Create a new abort controller
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

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
    [isProcessing, currentStepIndex, setProcessingStep, registration, scheduleBackgroundTask, isOffline]
  );
  
  // Trigger background task processing
  const triggerBackgroundProcessing = useCallback(() => {
    if (!registration?.active) {
      toast.error('Service worker not available for background processing');
      return;
    }
    
    registration.active.postMessage({
      type: 'PROCESS_BACKGROUND_TASKS'
    });
    
    toast.info('Background processing started');
  }, [registration]);
  
  // Initial load of background tasks
  useEffect(() => {
    if (registration?.active) {
      refreshBackgroundTasks();
    }
  }, [registration, refreshBackgroundTasks]);

  return {
    // Foreground processing
    processItems,
    isProcessing,
    progress,
    currentItem,
    totalItems,
    cancelProcessing,
    setProcessingStep,
    currentStepIndex,
    currentStepLabel,
    
    // Background processing
    scheduleBackgroundTask,
    backgroundTasks,
    refreshBackgroundTasks,
    isSyncingTasks,
    triggerBackgroundProcessing
  };
}
