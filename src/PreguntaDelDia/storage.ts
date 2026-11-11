export interface SavedState {
  /** Local day numbers on which the viewer drew a card. */
  days: number[];
}

const MAX_DAYS = 400;

export function loadState(key: string): SavedState {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.days)) {
      return { days: parsed.days.filter((d: unknown) => typeof d === 'number') };
    }
  } catch {
    /* storage unavailable (private mode etc.) */
  }
  return { days: [] };
}

export function saveDraw(key: string, day: number): SavedState {
  const state = loadState(key);
  if (!state.days.includes(day)) state.days.push(day);
  state.days = state.days.sort((a, b) => a - b).slice(-MAX_DAYS);
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  return state;
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
