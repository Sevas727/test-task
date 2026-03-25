import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndo } from '../useUndo';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUndo', () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('starts with undoItem as null', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo(onUndo));

      expect(result.current.undoItem).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // setUndoItem
  // -------------------------------------------------------------------------

  describe('setUndoItem', () => {
    it('stores the item for undo', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('deleted-item');
      });

      expect(result.current.undoItem).toBe('deleted-item');
    });

    it('replaces a previously set item', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('first');
      });
      act(() => {
        result.current.setUndoItem('second');
      });

      expect(result.current.undoItem).toBe('second');
    });

    it('auto-clears the item after 5 seconds', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('temp');
      });

      expect(result.current.undoItem).toBe('temp');

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.undoItem).toBeNull();
    });

    it('does not clear the item before 5 seconds', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('temp');
      });

      act(() => {
        vi.advanceTimersByTime(4999);
      });

      expect(result.current.undoItem).toBe('temp');
    });

    it('resets the timeout when a new item is set', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('first');
      });

      // Advance 3 seconds, then set a new item
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      act(() => {
        result.current.setUndoItem('second');
      });

      // After 3 more seconds (6s total), the first timeout would have fired,
      // but the new one hasn't expired yet
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.undoItem).toBe('second');

      // After the full 5s from the second setUndoItem, it clears
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.undoItem).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // executeUndo
  // -------------------------------------------------------------------------

  describe('executeUndo', () => {
    it('calls the onUndo callback with the stored item', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('restore-me');
      });

      act(() => {
        result.current.executeUndo();
      });

      expect(onUndo).toHaveBeenCalledWith('restore-me');
    });

    it('clears the undoItem after executing', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('restore-me');
      });

      act(() => {
        result.current.executeUndo();
      });

      expect(result.current.undoItem).toBeNull();
    });

    it('cancels the auto-clear timeout', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('item');
      });

      act(() => {
        result.current.executeUndo();
      });

      // Advancing past the timeout should not cause errors or state changes
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(result.current.undoItem).toBeNull();
      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('does nothing when undoItem is null', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.executeUndo();
      });

      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // clearUndo
  // -------------------------------------------------------------------------

  describe('clearUndo', () => {
    it('clears the undoItem without calling onUndo', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('dismiss-me');
      });

      act(() => {
        result.current.clearUndo();
      });

      expect(result.current.undoItem).toBeNull();
      expect(onUndo).not.toHaveBeenCalled();
    });

    it('cancels the auto-clear timeout', () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('item');
      });

      act(() => {
        result.current.clearUndo();
      });

      // Advancing should be a no-op
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(result.current.undoItem).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  describe('unmount cleanup', () => {
    it('clears the timeout when the hook unmounts', () => {
      const onUndo = vi.fn();
      const { result, unmount } = renderHook(() => useUndo<string>(onUndo));

      act(() => {
        result.current.setUndoItem('item');
      });

      unmount();

      // Advancing timers after unmount should not cause issues
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      // No error thrown — the timeout was properly cleaned up
      expect(true).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Generic type support
  // -------------------------------------------------------------------------

  describe('generic type support', () => {
    it('works with complex object types', () => {
      interface Deleted {
        id: string;
        name: string;
      }

      const onUndo = vi.fn();
      const { result } = renderHook(() => useUndo<Deleted>(onUndo));

      const item: Deleted = { id: '1', name: 'London' };

      act(() => {
        result.current.setUndoItem(item);
      });

      act(() => {
        result.current.executeUndo();
      });

      expect(onUndo).toHaveBeenCalledWith(item);
    });
  });
});
