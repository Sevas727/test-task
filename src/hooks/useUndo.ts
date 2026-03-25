import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Command pattern interface for undo operations.
 * Each command encapsulates the data and the action to reverse a deletion.
 */
export interface UndoCommand<T> {
  readonly item: T;
  execute(): void;
}

interface UndoState<T> {
  command: UndoCommand<T> | null;
}

const UNDO_TIMEOUT = 5000; // 5 seconds

/**
 * Custom hook for undo functionality using the Command pattern.
 * Manages an undo command with automatic timeout.
 *
 * @param onUndo - callback invoked with the item when undo is executed
 */
export const useUndo = <T>(onUndo: (item: T) => void) => {
  const [undoState, setUndoState] = useState<UndoState<T>>({
    command: null,
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

  const setUndoItem = useCallback(
    (item: T) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Create a command that encapsulates the undo action
      const command: UndoCommand<T> = {
        item,
        execute() {
          onUndo(item);
        },
      };

      // Set new timeout
      const timeoutId = setTimeout(() => {
        setUndoState({ command: null });
        timeoutRef.current = null;
      }, UNDO_TIMEOUT);

      timeoutRef.current = timeoutId;
      setUndoState({ command });
    },
    [onUndo]
  );

  const executeUndo = useCallback(() => {
    if (undoState.command) {
      undoState.command.execute();

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setUndoState({ command: null });
    }
  }, [undoState.command]);

  const clearUndo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setUndoState({ command: null });
  }, []);

  return {
    undoItem: undoState.command?.item ?? null,
    setUndoItem,
    executeUndo,
    clearUndo,
  };
};
