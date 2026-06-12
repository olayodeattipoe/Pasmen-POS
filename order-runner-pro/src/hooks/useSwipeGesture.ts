import { useState, useRef, useCallback } from 'react';

interface SwipeState {
  offsetX: number;
  isDragging: boolean;
  isCompleted: boolean;
}

interface UseSwipeGestureOptions {
  threshold?: number;
  onSwipeComplete?: () => void;
}

export function useSwipeGesture({ 
  threshold = 150, 
  onSwipeComplete 
}: UseSwipeGestureOptions = {}) {
  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    isDragging: false,
    isCompleted: false,
  });
  
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow right swipe
    if (diff > 0) {
      setState(prev => ({ ...prev, offsetX: Math.min(diff, threshold + 50) }));
    }
  }, [state.isDragging, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (state.offsetX > threshold) {
      setState(prev => ({ ...prev, isCompleted: true, isDragging: false }));
      onSwipeComplete?.();
    } else {
      setState({ offsetX: 0, isDragging: false, isCompleted: false });
    }
  }, [state.offsetX, threshold, onSwipeComplete]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    setState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!state.isDragging) return;
    
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    
    if (diff > 0) {
      setState(prev => ({ ...prev, offsetX: Math.min(diff, threshold + 50) }));
    }
  }, [state.isDragging, threshold]);

  const handleMouseUp = useCallback(() => {
    if (state.offsetX > threshold) {
      setState(prev => ({ ...prev, isCompleted: true, isDragging: false }));
      onSwipeComplete?.();
    } else {
      setState({ offsetX: 0, isDragging: false, isCompleted: false });
    }
  }, [state.offsetX, threshold, onSwipeComplete]);

  const handleMouseLeave = useCallback(() => {
    if (state.isDragging) {
      setState({ offsetX: 0, isDragging: false, isCompleted: false });
    }
  }, [state.isDragging]);

  const reset = useCallback(() => {
    setState({ offsetX: 0, isDragging: false, isCompleted: false });
  }, []);

  return {
    ...state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
    reset,
  };
}
