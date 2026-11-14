/**
 * The viewer's own deck, as plain data and pure functions (no Preact, no storage).
 *
 * There is one shared pile, `order`. Each themed deck is that pile filtered to its
 * cards, so a card drawn from any deck is gone from every deck that contains it,
 * and "Todas" is simply the unfiltered pile. Drawn cards move to `history` until
 * they're returned.
 *
 * Every function returns a new state and never mutates its input. Randomness comes
 * in as `rng` so tests can be deterministic.
 */

export interface DrawnCard {
  id: string;
  /** When it was drawn (ms since epoch). */
  at: number;
}

export interface DayCount {
  /** Local day number (see daily.ts). */
  day: number;
  draws: number;
}

export interface DeckState {
  v: 2;
  /** Undrawn card ids, top of the pile first. */
  order: string[];
  /** Drawn cards, oldest first. */
  history: DrawnCard[];
  /** The card face up on the table, if any (it's also in `history`). */
  current: string | null;
  /** Draws per day, for the streak. */
  days: DayCount[];
  /** The selected deck. */
  deckId: string;
}

export type Rng = () => number;

/** Uniform in [0, 1) from the browser's cryptographic generator. */
export const cryptoRng: Rng = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

const MAX_DAYS = 400;

function shuffled<T>(items: T[], rng: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function insertRandomly(order: string[], id: string, rng: Rng): string[] {
  const at = Math.floor(rng() * (order.length + 1));
  return [...order.slice(0, at), id, ...order.slice(at)];
}

export function newState(ids: string[], deckId: string, rng: Rng): DeckState {
  return { v: 2, order: shuffled(ids, rng), history: [], current: null, days: [], deckId };
}

/**
 * Bring a saved state in line with the current questions: forget cards that no
 * longer exist and shuffle new ones into the pile at random places.
 */
export function sync(state: DeckState, ids: string[], rng: Rng): DeckState {
  const known = new Set(ids);
  const seen = new Set<string>();
  const history = state.history.filter((h) => known.has(h.id) && !seen.has(h.id) && seen.add(h.id));
  let order = state.order.filter((id) => known.has(id) && !seen.has(id) && seen.add(id));
  for (const id of ids) {
    if (!seen.has(id)) {
      order = insertRandomly(order, id, rng);
      seen.add(id);
    }
  }
  const current = state.current && history.some((h) => h.id === state.current) ? state.current : null;
  return { ...state, order, history, current };
}

/** Draw the top card of a deck. Returns null when the deck is empty. */
export function draw(state: DeckState, deck: Set<string>, today: number, now: number): DeckState | null {
  const index = state.order.findIndex((id) => deck.has(id));
  if (index < 0) return null;
  const id = state.order[index];
  const days = state.days.filter((d) => d.day !== today);
  days.push({ day: today, draws: drawsToday(state, today) + 1 });
  days.sort((a, b) => a.day - b.day);
  return {
    ...state,
    order: [...state.order.slice(0, index), ...state.order.slice(index + 1)],
    history: [...state.history, { id, at: now }],
    current: id,
    days: days.slice(-MAX_DAYS),
  };
}

/** Shuffle a deck's undrawn cards. Other decks' cards keep their places in the pile. */
export function shuffle(state: DeckState, deck: Set<string>, rng: Rng): DeckState {
  const slots: number[] = [];
  state.order.forEach((id, i) => deck.has(id) && slots.push(i));
  const mixed = shuffled(
    slots.map((i) => state.order[i]),
    rng,
  );
  const order = state.order.slice();
  slots.forEach((slot, k) => (order[slot] = mixed[k]));
  return { ...state, order };
}

/** Put a drawn card back into the pile at a random place. */
export function returnCard(state: DeckState, id: string, rng: Rng): DeckState {
  if (!state.history.some((h) => h.id === id)) return state;
  return {
    ...state,
    order: insertRandomly(state.order, id, rng),
    history: state.history.filter((h) => h.id !== id),
    current: state.current === id ? null : state.current,
  };
}

/** Put every drawn card from a deck back, then shuffle that deck. */
export function returnAll(state: DeckState, deck: Set<string>, rng: Rng): DeckState {
  const back = state.history.filter((h) => deck.has(h.id)).map((h) => h.id);
  const next: DeckState = {
    ...state,
    order: [...state.order, ...back],
    history: state.history.filter((h) => !deck.has(h.id)),
    current: state.current && deck.has(state.current) ? null : state.current,
  };
  return shuffle(next, deck, rng);
}

/** Take the face-up card off the table (it stays in the history). */
export function clearTable(state: DeckState): DeckState {
  return state.current === null ? state : { ...state, current: null };
}

export function selectDeck(state: DeckState, deckId: string): DeckState {
  return { ...state, deckId, current: null };
}

export function remaining(state: DeckState, deck: Set<string>): number {
  return state.order.reduce((n, id) => n + (deck.has(id) ? 1 : 0), 0);
}

export function drawsToday(state: DeckState, today: number): number {
  return state.days.find((d) => d.day === today)?.draws ?? 0;
}

/** Days with at least one draw, for the streak. */
export function drawDays(state: DeckState): number[] {
  return state.days.filter((d) => d.draws > 0).map((d) => d.day);
}
