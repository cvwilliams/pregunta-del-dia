/**
 * Riffle-and-bridge shuffle, played on a stack of stand-in card backs.
 *
 *   split   - the deck is cut: the top half slides right, the bottom half left,
 *             each tilted so their inner corners point at each other
 *   riffle  - cards fall alternately from the bottom of each half into the
 *             middle, interleaving (left, right, left, right ...)
 *   bridge  - the two interleaved halves arch toward you, then release
 *   square  - pushed together, tapped square, and set down on the deck
 *
 * Each card gets its own keyframes (its drop time depends on where it sits in
 * the riffle), so this uses the Web Animations API rather than CSS keyframes.
 * It's only the picture: the real reshuffle happens in deck.ts.
 */

export const SHUFFLE_CARDS = 16;
const DURATION = 2600;

export interface ShuffleGeometry {
  /** Card width and height in px. */
  width: number;
  height: number;
  /** How far the deck's edge sticks out below the top card, in px. */
  depth: number;
}

interface Pose {
  x: number;
  y: number;
  r: number;
  ry?: number;
  s?: number;
  sy?: number;
}

const pose = ({ x, y, r, ry = 0, s = 1, sy = 1 }: Pose) =>
  `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg) rotateY(${ry.toFixed(1)}deg) scale(${s}, ${(s * sy).toFixed(3)})`;

/**
 * Animate `cards` (ordered top card first). Resolves when the shuffle is done.
 * `cancel()` stops it immediately, e.g. when the component unmounts.
 */
export function runShuffle(cards: HTMLElement[], { width: W, height: H, depth }: ShuffleGeometry) {
  const n = cards.length;
  const half = Math.ceil(n / 2);
  const restY = (idx: number) => (idx * depth) / Math.max(1, n - 1);

  const animations = cards.map((el, i) => {
    const right = i < half; // the cut: top half goes right
    const side = right ? 1 : -1;
    const k = right ? i : i - half; // position within its half, from the top

    // Riffle order, counted from the bottom of the finished pile: the bottom
    // card of each half lands first, alternating left/right.
    const s = right ? 2 * (half - 1 - i) + 1 : 2 * (n - 1 - i);
    const f = n - 1 - Math.min(s, n - 1); // final position, from the top

    const rest: Pose = { x: 0, y: restY(i), r: 0 };
    // Halves shrink a little as they're lifted apart, so they stay on a phone screen.
    const split: Pose = {
      x: side * (W * 0.17 + k * 0.4),
      y: -H * 0.05 + k * 1.6,
      r: -side * 8,
      s: 0.9,
    };
    const landed: Pose = { x: side * W * 0.06, y: restY(f) * 0.6 - H * 0.02, r: -side * 2 };
    // Inner edges swing toward you and the whole pile lifts: an arch.
    const bridge: Pose = { x: side * W * 0.1, y: landed.y - H * 0.07, r: -side * 4, ry: side * 34, s: 1.04 };
    const settled: Pose = { x: 0, y: restY(f), r: 0 };
    const tapped: Pose = { ...settled, y: settled.y + 2, sy: 0.985 };

    const drop = 0.2 + s * 0.021; // 0.20 - 0.515
    const land = drop + 0.075;
    const release = 0.72 + ((n - 1 - f) / Math.max(1, n - 1)) * 0.05; // bottom cards first

    const zBefore = n - i;
    const zAfter = n - f;

    return el.animate(
      [
        { offset: 0, transform: pose(rest), zIndex: zBefore, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
        { offset: 0.16, transform: pose(split), zIndex: zBefore, easing: 'linear' },
        { offset: drop, transform: pose(split), zIndex: zBefore, easing: 'cubic-bezier(0.35, 0, 0.55, 1)' },
        { offset: land, transform: pose(landed), zIndex: zAfter, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
        { offset: 0.64, transform: pose(bridge), zIndex: zAfter, easing: 'linear' },
        { offset: 0.7, transform: pose(bridge), zIndex: zAfter, easing: 'linear' },
        { offset: release, transform: pose(bridge), zIndex: zAfter, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
        { offset: release + 0.04, transform: pose(landed), zIndex: zAfter, easing: 'cubic-bezier(0.6, 0, 0.2, 1)' },
        { offset: 0.9, transform: pose(settled), zIndex: zAfter, easing: 'cubic-bezier(0.3, 0, 0.5, 1)' },
        { offset: 0.95, transform: pose(tapped), zIndex: zAfter, easing: 'ease-out' },
        { offset: 1, transform: pose(settled), zIndex: zAfter },
      ],
      { duration: DURATION, fill: 'both' },
    );
  });

  return {
    finished: Promise.all(animations.map((a) => a.finished)).then(() => undefined),
    cancel: () => animations.forEach((a) => a.cancel()),
  };
}
