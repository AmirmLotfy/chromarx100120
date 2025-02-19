
import { useEffect, useCallback } from 'react';
import { initializeSelector } from '../utils/selectUtils';

export const useElementSelector = (onElementSelected: (element: HTMLElement) => void) => {
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data.type === 'ELEMENT_SELECTED') {
      onElementSelected(event.data.payload.target);
    }
  }, [onElementSelected]);

  useEffect(() => {
    const selector = initializeSelector();
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      selector.stopSelecting();
    };
  }, [handleMessage]);

  return {
    startSelecting: () => {
      const selector = initializeSelector();
      selector.startSelecting();
    }
  };
};
