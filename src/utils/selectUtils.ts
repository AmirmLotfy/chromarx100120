
interface SelectionEvent {
  target: HTMLElement;
  clientX: number;
  clientY: number;
}

export const initializeSelector = () => {
  let isSelecting = false;
  let selectedElement: HTMLElement | null = null;
  let highlightElement: HTMLElement | null = null;

  const createHighlight = () => {
    const highlight = document.createElement('div');
    highlight.style.position = 'fixed';
    highlight.style.border = '2px solid #4CAF50';
    highlight.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    highlight.style.pointerEvents = 'none';
    highlight.style.zIndex = '10000';
    document.body.appendChild(highlight);
    return highlight;
  };

  const updateHighlight = (element: HTMLElement) => {
    if (!highlightElement) {
      highlightElement = createHighlight();
    }
    const rect = element.getBoundingClientRect();
    highlightElement.style.top = rect.top + 'px';
    highlightElement.style.left = rect.left + 'px';
    highlightElement.style.width = rect.width + 'px';
    highlightElement.style.height = rect.height + 'px';
  };

  const handleMouseOver = (event: MouseEvent) => {
    if (!isSelecting || !(event.target instanceof HTMLElement)) return;
    
    selectedElement = event.target;
    updateHighlight(selectedElement);
  };

  const handleClick = (event: MouseEvent) => {
    if (!isSelecting || !selectedElement) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const selectionEvent: SelectionEvent = {
      target: selectedElement,
      clientX: event.clientX,
      clientY: event.clientY
    };
    
    window.postMessage({ type: 'ELEMENT_SELECTED', payload: selectionEvent }, '*');
    stopSelecting();
  };

  const stopSelecting = () => {
    isSelecting = false;
    if (highlightElement) {
      highlightElement.remove();
      highlightElement = null;
    }
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('click', handleClick);
    document.body.style.cursor = 'default';
  };

  const startSelecting = () => {
    isSelecting = true;
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick);
    document.body.style.cursor = 'crosshair';
  };

  return {
    startSelecting,
    stopSelecting
  };
};
