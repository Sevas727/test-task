import { useRef, useCallback, useEffect } from 'react';

/**
 * Returns a debounced version of the provided callback.
 * The callback is delayed by `delay` ms; rapid calls reset the timer.
 */
export const useDebounce = <T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
};
