import { useState, useCallback } from 'react';

const DEFAULT_ANIMATION_DURATION = 300;

export const useAnimatedRemove = (
  onRemove: (id: string) => void,
  duration: number = DEFAULT_ANIMATION_DURATION
) => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const triggerRemove = useCallback(
    (id: string) => {
      setRemovingId(id);
      setTimeout(() => {
        onRemove(id);
        setRemovingId(null);
      }, duration);
    },
    [onRemove, duration]
  );

  return { removingId, triggerRemove };
};
