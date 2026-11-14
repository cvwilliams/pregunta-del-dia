import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearTable,
  draw,
  drawDays,
  drawsToday,
  newState,
  remaining,
  returnAll,
  returnCard,
  selectDeck,
  shuffle,
  sync,
  type DeckState,
  type Rng,
} from '../src/PreguntaDelDia/deck';
import { loadState, streakFor } from '../src/PreguntaDelDia/storage';

/** Deterministic generator so every test sees the same "random" order. */
function seeded(seed = 1): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ids = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'b4'];
const deckA = new Set(['a1', 'a2', 'a3']);
const deckB = new Set(['b1', 'b2', 'b3', 'b4']);
const all = new Set(ids);
const TODAY = 20_000;

/** Every card is in exactly one place: the pile or the history. */
function expectConsistent(s: DeckState) {
  const placed = [...s.order, ...s.history.map((h) => h.id)].sort();
  expect(placed).toEqual([...ids].sort());
}

describe('newState', () => {
  it('shuffles every card into the pile', () => {
    const s = newState(ids, 'todas', seeded());
    expect([...s.order].sort()).toEqual([...ids].sort());
    expect(s.history).toEqual([]);
    expect(s.current).toBeNull();
  });
});

describe('draw', () => {
  it('takes the first card of the selected deck and counts it for today', () => {
    const s = newState(ids, 'a', seeded());
    const top = s.order.find((id) => deckA.has(id))!;
    const next = draw(s, deckA, TODAY, 123)!;
    expect(next.current).toBe(top);
    expect(next.history).toEqual([{ id: top, at: 123 }]);
    expect(next.order).not.toContain(top);
    expect(drawsToday(next, TODAY)).toBe(1);
    expectConsistent(next);
  });

  it('shares one history: a card drawn from a themed deck is gone from Todas', () => {
    let s = newState(ids, 'a', seeded());
    s = draw(s, deckA, TODAY, 1)!;
    expect(remaining(s, deckA)).toBe(2);
    expect(remaining(s, all)).toBe(6);
    expect(remaining(s, deckB)).toBe(4);
  });

  it('returns null when the deck is empty', () => {
    let s = newState(ids, 'a', seeded());
    for (let i = 0; i < 3; i++) s = draw(s, deckA, TODAY, i)!;
    expect(remaining(s, deckA)).toBe(0);
    expect(draw(s, deckA, TODAY, 9)).toBeNull();
    expect(drawsToday(s, TODAY)).toBe(3);
  });

  it('does not change the input state', () => {
    const s = newState(ids, 'a', seeded());
    const before = JSON.stringify(s);
    draw(s, deckA, TODAY, 1);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('shuffle', () => {
  it("reorders only the selected deck's cards and leaves the rest in place", () => {
    const s = newState(ids, 'a', seeded(3));
    const next = shuffle(s, deckA, seeded(99));
    s.order.forEach((id, i) => {
      if (!deckA.has(id)) expect(next.order[i]).toBe(id);
      else expect(deckA.has(next.order[i])).toBe(true);
    });
    expect([...next.order].sort()).toEqual([...s.order].sort());
  });

  it('actually changes the order (over a few tries)', () => {
    const s = newState(ids, 'todas', seeded(5));
    const rng = seeded(7);
    const changed = [1, 2, 3, 4, 5].some(() => shuffle(s, all, rng).order.join() !== s.order.join());
    expect(changed).toBe(true);
  });
});

describe('returning cards', () => {
  let s: DeckState;
  beforeEach(() => {
    s = newState(ids, 'a', seeded());
    s = draw(s, deckA, TODAY, 1)!;
    s = draw(s, deckB, TODAY, 2)!;
  });

  it('returnCard puts one card back and clears it off the table', () => {
    const id = s.current!;
    const next = returnCard(s, id, seeded());
    expect(next.order).toContain(id);
    expect(next.history.map((h) => h.id)).not.toContain(id);
    expect(next.current).toBeNull();
    expectConsistent(next);
  });

  it('returnCard ignores cards that are not in the history', () => {
    expect(returnCard(s, 'nope', seeded())).toBe(s);
  });

  it("returnAll only returns that deck's cards", () => {
    const next = returnAll(s, deckA, seeded());
    expect(remaining(next, deckA)).toBe(3);
    expect(next.history.every((h) => deckB.has(h.id))).toBe(true);
    expect(next.history).toHaveLength(1);
    expectConsistent(next);
  });

  it("returning doesn't give back a draw", () => {
    const next = returnAll(s, all, seeded());
    expect(drawsToday(next, TODAY)).toBe(2);
  });
});

describe('table and deck selection', () => {
  it('clearTable keeps the card in the history', () => {
    const s = draw(newState(ids, 'a', seeded()), deckA, TODAY, 1)!;
    const next = clearTable(s);
    expect(next.current).toBeNull();
    expect(next.history).toHaveLength(1);
  });

  it('selectDeck switches deck and clears the table', () => {
    const s = draw(newState(ids, 'a', seeded()), deckA, TODAY, 1)!;
    const next = selectDeck(s, 'b');
    expect(next.deckId).toBe('b');
    expect(next.current).toBeNull();
  });
});

describe('sync', () => {
  it('adds new cards to the pile and forgets removed ones', () => {
    let s = newState(ids, 'todas', seeded());
    s = draw(s, all, TODAY, 1)!;
    const drawn = s.current!;
    const newIds = [...ids.filter((id) => id !== 'b4' || drawn === 'b4'), 'c1', 'c2'];
    const next = sync(s, newIds, seeded());
    expect(next.order).toContain('c1');
    expect(next.order).toContain('c2');
    if (drawn !== 'b4') expect(next.order).not.toContain('b4');
    expect(next.history.map((h) => h.id)).toEqual([drawn]);
    expect([...next.order, ...next.history.map((h) => h.id)].sort()).toEqual([...newIds].sort());
  });

  it('drops a face-up card that no longer exists', () => {
    let s = newState(ids, 'todas', seeded());
    s = draw(s, all, TODAY, 1)!;
    const next = sync(s, ids.filter((id) => id !== s.current), seeded());
    expect(next.current).toBeNull();
  });

  it('removes duplicates', () => {
    const s: DeckState = { ...newState(ids, 'todas', seeded()), order: [...ids, 'a1'] };
    expect(sync(s, ids, seeded()).order).toHaveLength(ids.length);
  });
});

describe('streak and days', () => {
  it('counts days with draws in a row', () => {
    let s = newState(ids, 'todas', seeded());
    s = draw(s, all, TODAY - 2, 1)!;
    s = draw(s, all, TODAY - 1, 2)!;
    s = draw(s, all, TODAY, 3)!;
    s = draw(s, all, TODAY, 4)!;
    expect(drawDays(s)).toEqual([TODAY - 2, TODAY - 1, TODAY]);
    expect(streakFor(drawDays(s), TODAY)).toBe(3);
    expect(drawsToday(s, TODAY)).toBe(2);
  });
});

describe('loadState', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
  });

  it('starts a fresh deck when nothing is saved', () => {
    const s = loadState('k', ids, 'todas', seeded());
    expect(s.order).toHaveLength(ids.length);
    expect(s.deckId).toBe('todas');
  });

  it('migrates the old one-card-a-day format and keeps the streak', () => {
    store.set('k', JSON.stringify({ days: [TODAY - 1, TODAY] }));
    const s = loadState('k', ids, 'todas', seeded());
    expect(s.v).toBe(2);
    expect(streakFor(drawDays(s), TODAY)).toBe(2);
    expect(s.order).toHaveLength(ids.length);
    expect(s.history).toEqual([]);
  });

  it('restores a saved deck', () => {
    let saved = newState(ids, 'b', seeded());
    saved = draw(saved, deckB, TODAY, 5)!;
    store.set('k', JSON.stringify(saved));
    const s = loadState('k', ids, 'todas', seeded());
    expect(s).toEqual(saved);
  });

  it('survives corrupt data', () => {
    store.set('k', '{not json');
    expect(loadState('k', ids, 'todas', seeded()).order).toHaveLength(ids.length);
  });
});
