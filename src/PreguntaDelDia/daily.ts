/** Days since the Unix epoch, counted on the viewer's local calendar. */
export function localDayNumber(d: Date = new Date()): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Small seeded PRNG so every visitor gets the same card on the same day. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledOrder(count: number, cycle: number, salt: number): number[] {
  const rand = mulberry32(Math.imul(cycle + 1, 2654435761) ^ salt);
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * Like shuffling a deck and drawing one card a day: every question is used
 * once per cycle before the deck is reshuffled, and no card repeats across
 * the reshuffle boundary.
 */
export function questionIndexForDay(day: number, count: number, salt = 0): number {
  if (count <= 1) return 0;
  const cycle = Math.floor(day / count);
  const pos = day - cycle * count;
  const order = shuffledOrder(count, cycle, salt);
  const prevLast = shuffledOrder(count, cycle - 1, salt)[count - 1];
  if (order[0] === prevLast) [order[0], order[1]] = [order[1], order[0]];
  return order[pos];
}

/** Cards left in the deck before it is reshuffled (including today's). */
export function cardsLeftInCycle(day: number, count: number): number {
  return count - (day % count);
}
