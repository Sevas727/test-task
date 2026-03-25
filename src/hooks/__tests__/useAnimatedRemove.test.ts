import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimatedRemove } from '../useAnimatedRemove';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAnimatedRemove', () => {
  it('starts with removingId as null', () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() => useAnimatedRemove(onRemove));

    expect(result.current.removingId).toBeNull();
  });

  it('sets removingId immediately when triggerRemove is called', () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() => useAnimatedRemove(onRemove));

    act(() => {
      result.current.triggerRemove('item-1');
    });

    expect(result.current.removingId).toBe('item-1');
  });

  it('calls onRemove after the animation duration', () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() => useAnimatedRemove(onRemove, 300));

    act(() => {
      result.current.triggerRemove('item-1');
    });

    expect(onRemove).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onRemove).toHaveBeenCalledWith('item-1');
  });

  it('resets removingId after animation completes', () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() => useAnimatedRemove(onRemove, 300));

    act(() => {
      result.current.triggerRemove('item-1');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.removingId).toBeNull();
  });

  it('defaults animation duration to 300ms', () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() => useAnimatedRemove(onRemove));

    act(() => {
      result.current.triggerRemove('item-1');
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(onRemove).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onRemove).toHaveBeenCalledWith('item-1');
  });
});
