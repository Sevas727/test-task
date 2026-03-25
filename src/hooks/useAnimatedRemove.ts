import { useState, useCallback } from 'react';

/** Default CSS animation duration in milliseconds (matches Tailwind's fade-out-left) */
const DEFAULT_ANIMATION_DURATION = 300;

/**
 * Hook that manages a two-phase removal: first triggers a CSS exit animation
 * by setting `removingId`, then calls the actual `onRemove` callback after
 * the animation duration elapses.
 *
 * @param onRemove - Callback invoked after the animation completes
 * @param duration - Animation duration in ms (default: 300)
 * @returns `removingId` to apply animation classes, `triggerRemove` to initiate removal
 */
export const useAnimatedRemove = (
  onRemove: (id: string) => void,
  duration: number = DEFAULT_ANIMATION_DURATION
) => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const triggerRemove = useCallback(
    (id: string) => {
      setRemovingId(id);
      // Wait for CSS animation to finish before invoking the actual remove
      setTimeout(() => {
        onRemove(id);
        setRemovingId(null);
      }, duration);
    },
    [onRemove, duration]
  );

  return { removingId, triggerRemove };
};
