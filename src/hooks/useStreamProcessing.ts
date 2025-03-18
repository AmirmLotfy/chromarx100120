
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { enhancedStorage } from '@/services/enhancedStorageService';

interface ProcessOptions<T> {
  onProgress?: (processed: number, total: number, progress: number) => void;
  onComplete?: (results: T[]) => void;
  onError?: (error: Error, item?: any) => void;
  chunkSize?: number;
  processInBackground?: boolean;
  stepLabels?: string[];
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: number;
  stepLabel: string;
  processed: number;
  total: number;
  results: any[];
  errors: { item: any; error: string }[];
}

export function useStreamProcessing<T>() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: 0,
    stepLabel: '',
    processed: 0,
    total: 0,
    results: [],
    errors: []
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  
  // Function to refresh task list
  const refreshTasks = useCallback(async () => {
    try {
      // Use the Chrome runtime messaging to get tasks from the service worker
      if (chrome?.runtime) {
        chrome.runtime.sendMessage(
          { type: 'GET_TASKS' },
          (response) => {
            if (response && response.success) {
              setTasks(response.tasks || []);
            }
          }
        );
      } else {
        console.warn('Chrome runtime not available');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);
  
  // Load tasks on mount
  useEffect(() => {
    refreshTasks();
    
    // Set up listener for task updates
    const handleMessage = (message: any) => {
      if (message.type === 'TASK_UPDATED') {
        refreshTasks();
      }
    };
    
    if (chrome?.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage);
      
      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      };
    }
  }, [refreshTasks]);
  
  // Function to process items in foreground with streaming
  const processInForeground = async <R>(
    items: any[],
    processFn: (item: any, index: number) => Promise<R>,
    options: ProcessOptions<R> = {}
  ): Promise<R[]> => {
    if (state.isProcessing) {
      throw new Error('Processing already in progress');
    }
    
    const {
      onProgress,
      onComplete,
      onError,
      chunkSize = 10,
      stepLabels = []
    } = options;
    
    // Initialize state
    setState({
      isProcessing: true,
      progress: 0,
      currentStep: 0,
      stepLabel: stepLabels[0] || 'Processing',
      processed: 0,
      total: items.length,
      results: [],
      errors: []
    });
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    try {
      const results: R[] = [];
      const errors: { item: any; error: string }[] = [];
      let processed = 0;
      
      // Process in chunks using async generator
      for (let i = 0; i < items.length; i += chunkSize) {
        // Check if processing was cancelled
        if (signal.aborted) {
          throw new Error('Processing cancelled');
        }
        
        const chunk = items.slice(i, i + chunkSize);
        const chunkPromises = chunk.map(async (item, chunkIndex) => {
          const index = i + chunkIndex;
          try {
            return await processFn(item, index);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push({ item, error: errorMessage });
            
            if (onError) {
              onError(error instanceof Error ? error : new Error(errorMessage), item);
            }
            
            return null;
          }
        });
        
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults.filter((r): r is R => r !== null));
        
        processed += chunk.length;
        const progress = Math.round((processed / items.length) * 100);
        
        // Calculate current step based on progress
        let currentStep = 0;
        if (stepLabels.length > 1) {
          currentStep = Math.min(
            Math.floor((progress / 100) * stepLabels.length),
            stepLabels.length - 1
          );
        }
        
        // Update state
        setState({
          isProcessing: true,
          progress,
          currentStep,
          stepLabel: stepLabels[currentStep] || 'Processing',
          processed,
          total: items.length,
          results,
          errors
        });
        
        if (onProgress) {
          onProgress(processed, items.length, progress);
        }
        
        // Small delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      if (onComplete) {
        onComplete(results);
      }
      
      // Update final state
      setState({
        isProcessing: false,
        progress: 100,
        currentStep: stepLabels.length - 1,
        stepLabel: stepLabels[stepLabels.length - 1] || 'Complete',
        processed: items.length,
        total: items.length,
        results,
        errors
      });
      
      return results;
    } catch (error) {
      console.error('Error during stream processing:', error);
      
      // Update state with error
      setState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      throw error;
    }
  };
  
  // Function to process items in background using service worker
  const processInBackground = async <R>(
    items: any[],
    processFn: (item: any, index: number) => Promise<R>,
    options: ProcessOptions<R> = {}
  ): Promise<string> => {
    const { onComplete, onError } = options;
    
    // Create task data
    const taskData = {
      items,
      processFnBody: processFn.toString(),
      options: {
        ...options,
        onComplete: undefined, // Cannot serialize functions
        onError: undefined // Cannot serialize functions
      }
    };
    
    // Schedule the task with the service worker
    return new Promise((resolve, reject) => {
      if (!chrome?.runtime) {
        reject(new Error('Chrome runtime not available'));
        return;
      }
      
      chrome.runtime.sendMessage(
        {
          type: 'SCHEDULE_TASK',
          payload: {
            type: 'PROCESS_ITEMS',
            data: taskData,
            priority: 'normal'
          }
        },
        (response) => {
          if (response && response.success) {
            toast.success('Background processing task scheduled');
            refreshTasks();
            resolve(response.taskId);
          } else {
            const error = new Error(response?.error || 'Failed to schedule task');
            if (onError) {
              onError(error);
            }
            reject(error);
          }
        }
      );
    });
  };
  
  // Function to process items (either foreground or background)
  const processItems = async <R>(
    items: any[],
    processFn: (item: any, index: number) => Promise<R>,
    options: ProcessOptions<R> = {}
  ): Promise<R[] | string> => {
    const { processInBackground = false } = options;
    
    if (processInBackground) {
      return processInBackground(items, processFn, options);
    } else {
      return processInForeground(items, processFn, options);
    }
  };
  
  // Function to cancel processing
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      
      setState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      toast.info('Processing cancelled');
      return true;
    }
    return false;
  }, []);
  
  // Function to schedule a background task
  const scheduleBackgroundTask = useCallback(async (task: {
    type: string;
    data: any;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<string | null> => {
    if (!chrome?.runtime) {
      console.warn('Chrome runtime not available');
      return null;
    }
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'SCHEDULE_TASK',
          payload: {
            type: task.type,
            data: task.data,
            priority: task.priority || 'normal'
          }
        },
        (response) => {
          if (response && response.success) {
            refreshTasks();
            resolve(response.taskId);
          } else {
            resolve(null);
          }
        }
      );
    });
  }, [refreshTasks]);
  
  // Function to trigger background task processing
  const triggerBackgroundProcessing = useCallback(async (): Promise<boolean> => {
    if (!chrome?.runtime) {
      console.warn('Chrome runtime not available');
      return false;
    }
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'PROCESS_TASKS' },
        (response) => {
          refreshTasks();
          resolve(response && response.success);
        }
      );
    });
  }, [refreshTasks]);
  
  return {
    ...state,
    processItems,
    cancelProcessing,
    backgroundTasks: tasks,
    refreshBackgroundTasks: refreshTasks,
    scheduleBackgroundTask,
    triggerBackgroundProcessing
  };
}

export default useStreamProcessing;
