import { newState, sync, type DayCount, type DeckState, type DrawnCard, type Rng } from './deck';

/**
 * Load the viewer's deck from localStorage, brought in line with the current
 * questions. Starts a fresh shuffled deck if nothing is saved or storage is
 * unavailable (private mode etc.).
 *
 * Version 1 (one shared card a day) saved only `{ days: number[] }`. Those days
 * carry over so the streak survives; it didn't record which cards were drawn.
 */
export function loadState(key: string, ids: string[], defaultDeckId: string, rng: Rng): DeckState {
  let saved: DeckState | null = null;
  try {
    const raw = localStorage.getItem(key);
    saved = raw ? parse(JSON.parse(raw), ids, defaultDeckId, rng) : null;
  } catch {
    /* unreadable or unavailable: start fresh */
  }
  return sync(saved ?? newState(ids, defaultDeckId, rng), ids, rng);
}

export function saveState(key: string, state: DeckState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* storage full or unavailable: the deck still works for this visit */
  }
}

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isStr = (x: unknown): x is string => typeof x === 'string';

function parse(data: any, ids: string[], defaultDeckId: string, rng: Rng): DeckState | null {
  if (!data || typeof data !== 'object') return null;
  if (data.v === 2) {
    return {
      v: 2,
      order: Array.isArray(data.order) ? data.order.filter(isStr) : [],
      history: Array.isArray(data.history)
        ? data.history.filter((h: any): h is DrawnCard => h && isStr(h.id) && isNum(h.at))
        : [],
      current: isStr(data.current) ? data.current : null,
      days: Array.isArray(data.days)
        ? data.days.filter((d: any): d is DayCount => d && isNum(d.day) && isNum(d.draws))
        : [],
      deckId: isStr(data.deckId) ? data.deckId : defaultDeckId,
    };
  }
  if (Array.isArray(data.days)) {
    const days = data.days.filter(isNum).map((day: number) => ({ day, draws: 1 }));
    return { ...newState(ids, defaultDeckId, rng), days };
  }
  return null;
}

/** Consecutive days drawn, ending today (or yesterday, if today isn't drawn yet). */
export function streakFor(days: number[], today: number): number {
  const set = new Set(days);
  let d = set.has(today) ? today : today - 1;
  let streak = 0;
  while (set.has(d)) {
    streak++;
    d--;
  }
  return streak;
}
