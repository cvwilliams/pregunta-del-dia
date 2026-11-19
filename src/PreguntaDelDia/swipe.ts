import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';

/** How far a press can wander and still count as a tap. */
export const TAP_SLOP = 8;
/** Drag past this share of the card and letting go throws it... */
export const THROW_DISTANCE = 0.3;
/** ...or flick it at least this fast (px/ms), at least MIN_FLICK px, the way it's going. */
export const THROW_SPEED = 0.5;
const MIN_FLICK = 30;
/** Past the end of a direction that does nothing, the card only moves this much. */
const RESISTANCE = 0.25;

/**
 * What letting go does: 1 or -1 throws the card that way along the axis, 0 springs
 * it back. `distance` and `velocity` are signed (px, px/ms); `size` is the card's
 * length along the axis.
 */
export function releaseOutcome(distance: number, velocity: number, size: number): -1 | 0 | 1 {
  const dir = Math.sign(distance) as -1 | 0 | 1;
  if (dir === 0) return 0;
  if (Math.abs(distance) >= size * THROW_DISTANCE) return dir;
  if (Math.abs(velocity) >= THROW_SPEED && Math.abs(distance) >= MIN_FLICK && Math.sign(velocity) === dir) return dir;
  return 0;
}

/**
 * Where a card thrown sideways goes: on along its release velocity (or the way it
 * was dragged, if it was let go slowly) until it's `reach` px further, at about the
 * speed it left the hand. It always leaves by the side it was thrown to, never
 * sailing off the top or bottom.
 */
export function throwPath(dx: number, dy: number, vx: number, vy: number, dir: -1 | 1, reach: number) {
  const speed = Math.hypot(vx, vy);
  let [ux, uy] = speed >= 0.3 && Math.sign(vx) === dir ? [vx, vy] : [dx, dy];
  const len = Math.hypot(ux, uy) || 1;
  ux = Math.max(0.6, Math.abs(ux / len)) * dir;
  uy = Math.sign(uy) * Math.sqrt(1 - ux * ux);
  return {
    x: dx + ux * reach,
    y: dy + uy * reach,
    ms: Math.round(Math.min(450, Math.max(220, reach / Math.max(speed, 1.5)))),
  };
}

/** Where a drag is, passed to onMove and onRelease. */
export interface Drag {
  /** Movement on each axis (px). Along `axis` it's resisted in a direction that can't throw. */
  dx: number;
  dy: number;
  /** The movement along `axis`. */
  d: number;
  /** The card's size; `size` is its length along `axis`. */
  width: number;
  height: number;
  size: number;
  /** Picked up by its top half (so it tilts the other way from one held at the bottom). */
  grabTop: boolean;
  /** 0 to 1: how close it is to being thrown. */
  progress: number;
  /** Speed at release (px/ms); 0 while moving. */
  vx: number;
  vy: number;
}

interface Press {
  id: number;
  el: HTMLElement;
  x: number;
  y: number;
  width: number;
  height: number;
  grabTop: boolean;
  /** A drag may start any way, not only along the axis. */
  anyStart: boolean;
  /** Past TAP_SLOP: no longer a tap. */
  dragging: boolean;
  /** Far enough to throw (for the haptic tick). */
  past: boolean;
  /** Recent positions, for the speed at release. */
  samples: { t: number; x: number; y: number }[];
}

export interface SwipeOptions {
  /** The axis cards are thrown along: 'x' sideways, 'y' up and down. */
  axis: 'x' | 'y';
  /** Which element inside the container is dragged. */
  handle: string;
  /** Read when a press starts: false leaves it alone. */
  enabled: (handle: HTMLElement, e: PointerEvent) => boolean;
  /**
   * Read when a press starts: true lets a drag start any way. Otherwise it has to
   * start mostly along `axis`, and one that starts the other way is left to the
   * browser to scroll.
   */
  anyStart?: (handle: HTMLElement, e: PointerEvent) => boolean;
  /** Directions that can throw; the other moves with resistance and springs back. */
  allow?: (dir: -1 | 1) => boolean;
  onMove: (handle: HTMLElement, drag: Drag) => void;
  /** dir is 0 when the card springs back. */
  onRelease: (handle: HTMLElement, dir: -1 | 0 | 1, drag: Drag) => void;
}

/**
 * Pick a card up and throw it, without taking anything from taps: a press that
 * stays within TAP_SLOP is left to be an ordinary click, and once it becomes a
 * drag, the click it would end in is swallowed.
 *
 * Listens on `containerRef` (which must always be mounted) so cards that come and
 * go inside it are picked up. Options are read fresh on every event.
 */
export function useSwipe(containerRef: RefObject<HTMLElement>, options: SwipeOptions) {
  const opts = useRef(options);
  opts.current = options;

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let press: Press | null = null;
    let swallowClick = false;

    const drag = (p: Press, e: PointerEvent, vx = 0, vy = 0): Drag => {
      const { axis, allow } = opts.current;
      let dx = e.clientX - p.x;
      let dy = e.clientY - p.y;
      let d = axis === 'x' ? dx : dy;
      // Resisted in a direction that can't throw.
      if (d && allow && !allow(Math.sign(d) as -1 | 1)) {
        d *= RESISTANCE;
        if (axis === 'x') dx = d;
        else dy = d;
      }
      const size = axis === 'x' ? p.width : p.height;
      const progress = Math.min(1, Math.abs(d) / (size * THROW_DISTANCE));
      return { dx, dy, d, width: p.width, height: p.height, size, grabTop: p.grabTop, progress, vx, vy };
    };

    const down = (e: PointerEvent) => {
      swallowClick = false;
      if (press || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const el = (e.target as Element).closest<HTMLElement>(opts.current.handle);
      if (!el || !root.contains(el) || !opts.current.enabled(el, e)) return;
      const r = el.getBoundingClientRect();
      press = {
        id: e.pointerId,
        el,
        x: e.clientX,
        y: e.clientY,
        width: r.width,
        height: r.height,
        grabTop: e.clientY < r.top + r.height / 2,
        anyStart: opts.current.anyStart?.(el, e) ?? false,
        dragging: false,
        past: false,
        samples: [],
      };
    };

    const move = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      if (!press.dragging) {
        const ax = Math.abs(e.clientX - press.x);
        const ay = Math.abs(e.clientY - press.y);
        if (ax < TAP_SLOP && ay < TAP_SLOP) return;
        // Mostly the other way, where that's a scroll: not ours.
        const [a, b] = opts.current.axis === 'x' ? [ax, ay] : [ay, ax];
        if (!press.anyStart && b >= a) {
          press = null;
          return;
        }
        press.dragging = true;
        try {
          press.el.setPointerCapture(e.pointerId); // keep getting moves if it leaves the card
        } catch {
          // the pointer is already gone; the moves we get are enough
        }
        press.el.classList.add('is-dragging');
        getSelection()?.removeAllRanges();
      }
      e.preventDefault();
      press.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
      if (press.samples.length > 6) press.samples.shift();
      const now = drag(press, e);
      // A tick when it's far enough to throw (phones that support it), and only after
      // a first tap: before that, Chrome refuses and logs an error.
      const past = now.progress >= 1;
      if (past && !press.past && e.pointerType === 'touch' && navigator.userActivation?.hasBeenActive)
        navigator.vibrate?.(8);
      press.past = past;
      opts.current.onMove(press.el, now);
    };

    const up = (e: PointerEvent, cancelled: boolean) => {
      if (!press || e.pointerId !== press.id) return;
      const p = press;
      press = null;
      if (!p.dragging) return;
      p.el.classList.remove('is-dragging');
      swallowClick = true;
      // The click (if any) comes straight after pointerup; don't hold the flag past it.
      setTimeout(() => (swallowClick = false), 0);
      // Speed over the last ~100ms of the drag.
      const first = p.samples.find((s) => e.timeStamp - s.t < 100);
      const dt = first ? e.timeStamp - first.t : 0;
      const end = first && dt > 0 ? drag(p, e, (e.clientX - first.x) / dt, (e.clientY - first.y) / dt) : drag(p, e);
      const { allow, axis } = opts.current;
      let dir = cancelled ? 0 : releaseOutcome(end.d, axis === 'x' ? end.vx : end.vy, end.size);
      if (dir && allow && !allow(dir)) dir = 0;
      opts.current.onRelease(p.el, dir, end);
    };

    const onUp = (e: PointerEvent) => up(e, false);
    const onCancel = (e: PointerEvent) => up(e, true);
    // A mouse press on a card's text would start selecting it, and the selection would
    // win over the drag. So a single press doesn't select; double- and triple-click
    // still pick a word or the whole line. Buttons are left alone so they still focus.
    const mousedown = (e: MouseEvent) => {
      if (press && e.detail < 2 && !(e.target as Element).closest('button, a, input, textarea, select')) e.preventDefault();
    };

    // iOS decides a touch is a scroll (or a pull-to-refresh) on its first movement,
    // before the drag above has passed TAP_SLOP, and it doesn't reliably honour
    // touch-action for pull-to-refresh. Cancelling touchmove is what it does obey. So
    // while a finger is on a card: if it can be picked up any way, the page never gets
    // the touch; otherwise only a touch heading along the axis is kept from the page,
    // and one heading the other way is left to scroll. Touches elsewhere are untouched.
    const touchmove = (e: TouchEvent) => {
      if (!press || e.touches.length !== 1 || !e.cancelable) return;
      if (press.dragging || press.anyStart) return e.preventDefault();
      const t = e.touches[0];
      const ax = Math.abs(t.clientX - press.x);
      const ay = Math.abs(t.clientY - press.y);
      const [a, b] = opts.current.axis === 'x' ? [ax, ay] : [ay, ax];
      if (a > b) e.preventDefault();
    };

    const click = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.stopPropagation();
      e.preventDefault();
    };

    root.addEventListener('pointerdown', down);
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onCancel);
    root.addEventListener('mousedown', mousedown);
    root.addEventListener('click', click, true);
    // Not passive, so it can cancel the scroll.
    root.addEventListener('touchmove', touchmove, { passive: false });
    return () => {
      root.removeEventListener('touchmove', touchmove);
      root.removeEventListener('pointerdown', down);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onCancel);
      root.removeEventListener('mousedown', mousedown);
      root.removeEventListener('click', click, true);
    };
  }, [containerRef]);
}

/** Ease a dragged card back to where it was, with a little overshoot. */
export function springBack(el: HTMLElement, reduce: boolean) {
  if (reduce) {
    el.style.transform = '';
    el.style.opacity = '';
    return;
  }
  el.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.25), opacity 0.3s ease, scale 0.2s ease';
  el.style.transform = '';
  el.style.opacity = '';
  const done = (e?: TransitionEvent) => {
    if (e && (e.target !== el || e.propertyName !== 'transform')) return;
    el.style.transition = '';
    el.removeEventListener('transitionend', done);
  };
  el.addEventListener('transitionend', done);
  setTimeout(done, 500); // in case transitionend never comes (hidden tab)
}
