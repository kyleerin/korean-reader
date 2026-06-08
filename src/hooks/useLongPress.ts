import { useCallback, useRef } from 'react';

const DEFAULT_MS = 550;

export function useLongPress(onLongPress: () => void, ms = DEFAULT_MS) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const onTouchStart = useCallback(() => {
    fired.current = false;
    clear();
    timer.current = setTimeout(() => {
      fired.current = true;
      onLongPress();
    }, ms);
  }, [clear, ms, onLongPress]);

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  const onTouchMove = useCallback(() => {
    clear();
  }, [clear]);

  const onClickCapture = useCallback((e: { preventDefault: () => void; stopPropagation: () => void }) => {
    if (fired.current) {
      fired.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onClickCapture,
  };
}
