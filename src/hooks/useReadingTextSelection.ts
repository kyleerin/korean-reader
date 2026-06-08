import { useEffect, useRef, type RefObject } from 'react';
import type { AnalyzedText } from '../domain/model';
import { resolveTextSelection, type TextSelection } from '../selection/resolve';

const CHECK_DELAY_MS = 350;

function readSelection(
  container: HTMLElement,
  text: AnalyzedText,
): TextSelection | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return null;
  if (!sel.anchorNode || !container.contains(sel.anchorNode)) return null;
  if (sel.focusNode && !container.contains(sel.focusNode)) return null;

  const raw = sel.toString().trim();
  if (!raw) return null;

  return resolveTextSelection(text, raw);
}

/**
 * Opens the grammar panel when the user finishes selecting text.
 * Uses selectionchange + delayed touchend/mouseup for mobile Safari.
 */
export function useReadingTextSelection(
  containerRef: RefObject<HTMLElement | null>,
  text: AnalyzedText,
  onSelection: (selection: TextSelection) => void,
): void {
  const onSelectionRef = useRef(onSelection);
  onSelectionRef.current = onSelection;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function scheduleCheck() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;
        const resolved = readSelection(container, text);
        if (resolved) onSelectionRef.current(resolved);
      }, CHECK_DELAY_MS);
    }

    document.addEventListener('selectionchange', scheduleCheck);
    document.addEventListener('mouseup', scheduleCheck);
    document.addEventListener('touchend', scheduleCheck, { passive: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener('selectionchange', scheduleCheck);
      document.removeEventListener('mouseup', scheduleCheck);
      document.removeEventListener('touchend', scheduleCheck);
    };
  }, [containerRef, text]);
}

export function hasActiveTextSelection(container: HTMLElement | null): boolean {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return false;
  if (!container) return false;
  return Boolean(
    (sel.anchorNode && container.contains(sel.anchorNode))
    || (sel.focusNode && container.contains(sel.focusNode)),
  ) && sel.toString().trim().length > 0;
}
