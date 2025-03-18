
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export interface BackgroundTask {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  data: any;
  added: number;
  completed?: number;
  priority?: 'high' | 'normal' | 'low';
  error?: string;
  result?: any;
}

export interface ProcessingOptions<T, R> {
  items: T[];
  processInBackground: boolean;
  processingCallback: (item: T, index: number) => Promise<R>;
  onComplete?: (results: R[]) => void;
  onError?: (error: Error, item: T) => void;
  stepLabels?: string[];
  progressUpdateInterval?: number;
}

// Type predicate function to check if a value is a Promise
function isPromise<T>(value: any): value is Promise<T> {
  return value !== null && typeof value === 'object' && 'then' in value && typeof value.then === 'function';
}

export function useStreamProcessing<T>() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState<string>('');
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const processingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Function to refresh background tasks
  const refreshBackgroundTasks = useCallback(async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Get tasks from service worker
        const response = await chrome.runtime.sendMessage({ 
          type: "GET_TASKS"
        });
        
        if (response && response.success) {
          setBackgroundTasks(response.tasks || []);
        }
      } else {
        // In development: simulate getting tasks
        console.log('In development mode: would get background tasks here');
      }
    } catch (error) {
      console.error('Error refreshing background tasks:', error);
    }
  }, []);

  // Function to schedule a background task
  const scheduleBackgroundTask = useCallback(async (task: Omit<BackgroundTask, 'id' | 'status' | 'added' | 'progress'>) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Schedule via service worker
        const response = await chrome.runtime.sendMessage({
          type: "SCHEDULE_TASK",
          payload: task
        });
        
        if (response && response.success) {
          await refreshBackgroundTasks();
          return response.taskId;
        }
        return null;
      } else {
        // In development: simulate scheduling
        const taskId = `dev_${uuidv4()}`;
        console.log('In development mode: would schedule task:', taskId, task);
        
        // Add to local state for development
        const newTask: BackgroundTask = {
          id: taskId,
          status: 'pending',
          progress: 0,
          added: Date.now(),
          ...task
        };
        
        setBackgroundTasks(prev => [...prev, newTask]);
        return taskId;
      }
    } catch (error) {
      console.error('Error scheduling background task:', error);
      return null;
    }
  }, [refreshBackgroundTasks]);

  // Function to trigger background processing
  const triggerBackgroundProcessing = useCallback(async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({ 
          type: "PROCESS_TASKS"
        });
        
        if (response && response.success) {
          toast.success(`Processed ${response.processed} tasks`);
          await refreshBackgroundTasks();
          return true;
        }
        return false;
      } else {
        // In development: simulate processing
        console.log('In development mode: would process background tasks');
        toast.success('Processed background tasks (dev mode)');
        return true;
      }
    } catch (error) {
      console.error('Error triggering background processing:', error);
      return false;
    }
  }, [refreshBackgroundTasks]);

  // Function to cancel processing
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    processingRef.current = false;
    setIsProcessing(false);
    toast.info('Processing cancelled');
  }, []);

  // Main processing function
  const processItems = useCallback(async <R>(options: ProcessingOptions<T, R>): Promise<string | null> => {
    const {
      items,
      processInBackground,
      processingCallback,
      onComplete,
      onError,
      stepLabels = ['Processing...'],
      progressUpdateInterval = 100
    } = options;

    // If no items to process, return early
    if (!items || items.length === 0) {
      toast.info('No items to process');
      return null;
    }

    // If processing in background, schedule a task
    if (processInBackground) {
      const taskId = await scheduleBackgroundTask({
        type: 'PROCESS_ITEMS',
        data: {
          itemCount: items.length,
          timestamp: Date.now()
        },
        priority: 'normal'
      });
      
      if (taskId) {
        toast.success('Background processing task scheduled');
      } else {
        toast.error('Failed to schedule background processing task');
      }
      
      return taskId;
    }

    // If already processing, prevent starting another process
    if (processingRef.current) {
      toast.warning('Already processing items');
      return null;
    }

    // Setup for foreground processing
    processingRef.current = true;
    setIsProcessing(true);
    setProgress(0);
    setProcessed(0);
    setTotal(items.length);
    setStepLabel(stepLabels[0] || 'Processing...');

    // Create new abort controller for this processing session
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const results: R[] = [];
      const totalItems = items.length;
      const stepSize = stepLabels.length > 1 ? Math.floor(totalItems / (stepLabels.length - 1)) : totalItems;
      
      // Process each item with progress updates
      for (let i = 0; i < totalItems; i++) {
        // Check if processing was cancelled
        if (signal.aborted || !processingRef.current) {
          throw new Error('Processing cancelled');
        }

        // Update step label based on progress
        if (stepLabels.length > 1 && i > 0 && i % stepSize === 0) {
          const stepIndex = Math.min(Math.floor(i / stepSize), stepLabels.length - 1);
          setStepLabel(stepLabels[stepIndex]);
        }

        try {
          // Process the item
          const item = items[i];
          const result = await processingCallback(item, i);
          results.push(result);
          
          // Update progress
          const newProcessed = i + 1;
          setProcessed(newProcessed);
          const newProgress = Math.round((newProcessed / totalItems) * 100);
          setProgress(newProgress);
          
          // Small delay to allow UI updates
          if (i < totalItems - 1 && progressUpdateInterval > 0) {
            await new Promise(resolve => setTimeout(resolve, progressUpdateInterval));
          }
        } catch (error) {
          if (onError && error instanceof Error) {
            onError(error, items[i]);
          } else {
            console.error(`Error processing item ${i}:`, error);
          }
        }
      }

      // Final step label if available
      if (stepLabels.length > 0) {
        setStepLabel(stepLabels[stepLabels.length - 1]);
      }
      
      // Complete processing
      setProgress(100);
      setProcessed(totalItems);
      
      // Call onComplete callback if provided
      if (onComplete && typeof onComplete === 'function') {
        onComplete(results);
      }

      return 'success';
    } catch (error) {
      console.error('Processing error:', error);
      
      if (error instanceof Error && error.message !== 'Processing cancelled') {
        toast.error(`Processing error: ${error.message}`);
      }
      
      return null;
    } finally {
      // Clean up
      processingRef.current = false;
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [scheduleBackgroundTask]);

  return {
    isProcessing,
    progress,
    stepLabel,
    processed,
    total,
    cancelProcessing,
    processItems,
    backgroundTasks,
    refreshBackgroundTasks,
    scheduleBackgroundTask,
    triggerBackgroundProcessing
  };
}
