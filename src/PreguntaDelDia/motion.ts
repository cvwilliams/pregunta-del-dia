export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Run `fn` once the browser has painted, or after a short timer in tabs that don't
 * paint (hidden or frozen). Returns a function that cancels it.
 */
export function afterPaint(fn: () => void, timeoutMs = 120): () => void {
  let done = false;
  const once = () => {
    if (done) return;
    done = true;
    fn();
  };
  let frame = requestAnimationFrame(() => (frame = requestAnimationFrame(once)));
  const timer = setTimeout(once, timeoutMs);
  return () => {
    done = true;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
  };
}
