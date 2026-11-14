// Checks on the question deck itself, so mistakes are caught as it grows.
import { describe, expect, it } from 'vitest';
import { decks } from '../src/PreguntaDelDia/decks';
import { questions } from '../src/PreguntaDelDia/questions';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

describe('questions', () => {
  it('have unique ids', () => {
    const seen = new Set<string>();
    const dupes = questions.map((q) => q.id).filter((id) => seen.has(id) || !seen.add(id));
    expect(dupes).toEqual([]);
  });

  it('have the required fields', () => {
    const bad = questions.filter(
      (q) => !q.id || !q.es.trim() || !q.en.trim() || !q.category.trim() || !LEVELS.includes(q.level),
    );
    expect(bad.map((q) => q.id || q.es)).toEqual([]);
  });

  it('have no duplicate Spanish questions', () => {
    const seen = new Set<string>();
    const norm = (s: string) => s.toLowerCase().replace(/[¿?¡!.,\s]+/g, ' ').trim();
    const dupes = questions.filter((q) => seen.has(norm(q.es)) || !seen.add(norm(q.es)));
    expect(dupes.map((q) => q.id)).toEqual([]);
  });

  it('all belong to a deck', () => {
    const covered = new Set(decks.flatMap((d) => d.categories));
    const orphans = questions.filter((q) => !covered.has(q.category));
    expect(orphans.map((q) => `${q.id} (${q.category})`)).toEqual([]);
  });
});

describe('decks', () => {
  it('have unique ids and no category in two decks', () => {
    expect(new Set(decks.map((d) => d.id)).size).toBe(decks.length);
    const cats = decks.flatMap((d) => d.categories);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it('have card backs the cream prompt text is readable on (4.5:1)', () => {
    const lum = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const low = decks
      .filter((d) => d.back && contrast('#f6eedb', d.back[0]) < 4.5)
      .map((d) => `${d.id} ${d.back![0]}`);
    expect(low).toEqual([]);
  });

  it('are not empty', () => {
    const empty = decks.filter((d) => !questions.some((q) => d.categories.includes(q.category)));
    expect(empty.map((d) => d.id)).toEqual([]);
  });
});
