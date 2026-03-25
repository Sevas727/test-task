import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for undo functionality
 * Manages undo state with automatic timeout
 */

interface UndoState<T> {
  item: T | null;
}

const UNDO_TIMEOUT = 5000; // 5 seconds

export const useUndo = <T>(onUndo: (item: T) => void) => {
  const [undoState, setUndoState] = useState<UndoState<T>>({
    item: null,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const setUndoItem = useCallback((item: T) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      setUndoState({ item: null });
      timeoutRef.current = null;
    }, UNDO_TIMEOUT);

    timeoutRef.current = timeoutId;
    setUndoState({ item });
  }, []);

  const executeUndo = useCallback(() => {
    if (undoState.item) {
      onUndo(undoState.item);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setUndoState({ item: null });
    }
  }, [undoState.item, onUndo]);

  const clearUndo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setUndoState({ item: null });
  }, []);

  return {
    undoItem: undoState.item,
    setUndoItem,
    executeUndo,
    clearUndo,
  };
};
