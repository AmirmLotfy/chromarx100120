
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  DataStreamProcessor, 
  DataProcessorFn, 
  DataStreamOptions 
} from '@/utils/dataStreamUtils';

interface BatchProcessingState {
  isProcessing: boolean;
  progress: number;
  currentItem: number;
  totalItems: number;
  currentStepIndex: number;
  currentStepLabel: string;
}

export function useDataStreamProcessing<T, R = T>() {
  const [state, setState] = useState<BatchProcessingState>({
    isProcessing: false,
    progress: 0,
    currentItem: 0,
    totalItems: 0,
    currentStepIndex: 0,
    currentStepLabel: "",
  });
  
  const processorRef = useRef<DataStreamProcessor<T, R>>(new DataStreamProcessor<T, R>());
  
  // Update state helper
  const updateState = useCallback((updates: Partial<BatchProcessingState>) => {
    setState(current => ({ ...current, ...updates }));
  }, []);
  
  // Cancel processing
  const cancelProcessing = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.cancel();
      toast.info("Processing canceled");
      updateState({ isProcessing: false });
    }
  }, [updateState]);
  
  // Set current processing step
  const setProcessingStep = useCallback((index: number, steps?: string[]) => {
    updateState({
      currentStepIndex: index,
      currentStepLabel: steps && index < steps.length ? steps[index] : ""
    });
  }, [updateState]);
  
  // Process items with the stream processor
  const processItems = useCallback(async (
    items: T[],
    processFn: DataProcessorFn<T, R>,
    options: DataStreamOptions<T> & {
      stepLabels?: string[];
    } = {}
  ) => {
    if (state.isProcessing) {
      toast.warning('Processing is already in progress');
      return { success: false, results: [] as R[] };
    }
    
    if (!items.length) {
      toast.warning('No items to process');
      return { success: false, results: [] as R[] };
    }
    
    const { stepLabels, ...streamOptions } = options;
    
    // Create abort controller
    const abortController = new AbortController();
    
    // Update state for processing start
    updateState({
      isProcessing: true,
      progress: 0,
      currentItem: 0,
      totalItems: items.length,
      currentStepIndex: 0,
      currentStepLabel: stepLabels && stepLabels.length > 0 ? stepLabels[0] : ""
    });
    
    try {
      // Set up progress tracking
      const enhancedOptions: DataStreamOptions<T> = {
        ...streamOptions,
        abortSignal: abortController.signal,
        onProgress: (progress) => {
          updateState({ progress });
          
          // Call original onProgress if provided
          if (streamOptions.onProgress) {
            streamOptions.onProgress(progress);
          }
          
          // Update step if stepLabels provided
          if (stepLabels && stepLabels.length > 1) {
            const stepProgress = Math.floor((progress / 100) * stepLabels.length);
            if (stepProgress !== state.currentStepIndex && stepProgress < stepLabels.length) {
              setProcessingStep(stepProgress, stepLabels);
            }
          }
        },
        onBatchComplete: (processed, total, batch) => {
          updateState({ currentItem: processed });
          
          // Call original onBatchComplete if provided
          if (streamOptions.onBatchComplete) {
            streamOptions.onBatchComplete(processed, total, batch);
          }
        },
        onError: (error, item, index) => {
          console.error(`Error processing item at index ${index}:`, error);
          
          // Call original onError if provided
          if (streamOptions.onError) {
            streamOptions.onError(error, item, index);
          }
        }
      };
      
      // Process the items
      const results = await processorRef.current.process(items, processFn, enhancedOptions);
      
      if (!abortController.signal.aborted) {
        if (streamOptions.onComplete) {
          streamOptions.onComplete(results as unknown as T[]);
        }
        
        return { success: true, results };
      } else {
        return { success: false, results: [] as R[], canceled: true };
      }
    } catch (error) {
      console.error('Data stream processing failed:', error);
      toast.error('Processing failed');
      return { success: false, results: [] as R[], error };
    } finally {
      if (!abortController.signal.aborted) {
        updateState({ isProcessing: false });
      }
    }
  }, [state.isProcessing, state.currentStepIndex, updateState, setProcessingStep]);
  
  return {
    ...state,
    processItems,
    cancelProcessing,
    setProcessingStep,
  };
}
