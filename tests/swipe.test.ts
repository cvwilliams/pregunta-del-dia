import { describe, expect, it } from 'vitest';
import { releaseOutcome, throwPath } from '../src/PreguntaDelDia/swipe';

describe('releaseOutcome', () => {
  const size = 300; // a card 300px across: 90px is far enough to throw

  it('throws a card dragged far enough, the way it was dragged', () => {
    expect(releaseOutcome(95, 0, size)).toBe(1);
    expect(releaseOutcome(-95, 0, size)).toBe(-1);
  });

  it('springs back a short, slow drag', () => {
    expect(releaseOutcome(70, 0.1, size)).toBe(0);
    expect(releaseOutcome(0, 2, size)).toBe(0);
  });

  it('throws a quick flick that is short of the distance', () => {
    expect(releaseOutcome(40, 0.8, size)).toBe(1);
    expect(releaseOutcome(-40, -0.8, size)).toBe(-1);
  });

  it("doesn't throw a flick that's barely moved, or one pulled back the other way", () => {
    expect(releaseOutcome(15, 1, size)).toBe(0);
    expect(releaseOutcome(60, -0.8, size)).toBe(0);
  });
});

describe('throwPath', () => {
  it('carries on the way it was flicked, past the reach', () => {
    const t = throwPath(100, 20, 2, 1, 1, 800);
    expect(t.x).toBeGreaterThan(100 + 600);
    expect(t.y).toBeGreaterThan(20);
    expect(t.ms).toBeGreaterThanOrEqual(220);
    expect(t.ms).toBeLessThanOrEqual(450);
  });

  it('follows the drag when let go slowly', () => {
    const t = throwPath(-150, -60, 0, 0, -1, 800);
    expect(t.x).toBeLessThan(-150 - 600);
    expect(t.y).toBeLessThan(-60);
  });

  it('always leaves by the side it was thrown to, even flicked mostly downwards', () => {
    const t = throwPath(110, 200, 0.4, 3, 1, 800);
    expect(t.x - 110).toBeGreaterThanOrEqual(0.6 * 800 - 1);
    expect(throwPath(-110, 0, 1, 0, -1, 800).x).toBeLessThan(-110); // flicked back the other way: follows the drag
  });

  it('goes faster for a faster flick', () => {
    expect(throwPath(100, 0, 4, 0, 1, 800).ms).toBeLessThan(throwPath(100, 0, 1.6, 0, 1, 800).ms);
  });
});
