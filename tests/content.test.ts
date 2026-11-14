// Checks on the questions and decks, so mistakes are caught as the deck grows.
import { describe, expect, it } from 'vitest';
import { decks } from '../src/PreguntaDelDia/decks';
import { questions, type Question } from '../src/PreguntaDelDia/questions';
import ranges from '../scripts/question-ranges.json';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

// Each file in questions/ holds one deck's cards, named after the deck's id.
const files = Object.fromEntries(
  Object.entries(
    import.meta.glob<Question[]>('../src/PreguntaDelDia/questions/*.json', { eager: true, import: 'default' }),
  ).map(([path, qs]) => [path.split('/').pop()!.replace('.json', ''), qs]),
);

/** The cards that fail `bad`, as "id: es" so a failure says which ones. */
const failing = (bad: (q: Question) => boolean) => questions.filter(bad).map((q) => `${q.id}: ${q.es}`);

describe('questions', () => {
  it('have unique ids in the q0001 format', () => {
    const seen = new Set<string>();
    expect(questions.map((q) => q.id).filter((id) => seen.has(id) || !seen.add(id))).toEqual([]);
    expect(failing((q) => !/^q\d{4}$/.test(q.id))).toEqual([]);
  });

  it('have every field: question, translation, level, category, 2–4 vocab pairs and a starter', () => {
    const filled = (s: unknown) => typeof s === 'string' && s.trim() !== '';
    expect(
      failing(
        (q) =>
          !filled(q.es) ||
          !filled(q.en) ||
          !filled(q.category) ||
          !LEVELS.includes(q.level) ||
          !filled(q.starter) ||
          !Array.isArray(q.vocab) ||
          q.vocab.length < 2 ||
          q.vocab.length > 4 ||
          !q.vocab.every((pair) => pair.length === 2 && pair.every(filled)),
      ),
    ).toEqual([]);
  });

  it('are punctuated: questions have ¿…? (it may open mid-sentence), prompts end in a full stop', () => {
    const ok = (q: Question) =>
      (q.es.endsWith('?') && q.es.includes('¿') && q.en.endsWith('?')) ||
      (q.es.endsWith('.') && !q.es.includes('¿') && q.en.endsWith('.'));
    expect(failing((q) => !ok(q))).toEqual([]);
  });

  it('have no duplicates', () => {
    const norm = (s: string) => s.toLowerCase().replace(/[¿?¡!.,;:\s]+/g, ' ').trim();
    const seen = new Set<string>();
    expect(failing((q) => seen.has(norm(q.es)) || !seen.add(norm(q.es)))).toEqual([]);
  });

  it("sit in their deck's file, with one of its categories", () => {
    expect(Object.keys(files).sort()).toEqual(decks.map((d) => d.id).sort());
    const misplaced = decks.flatMap((d) =>
      files[d.id].filter((q) => !d.categories.includes(q.category)).map((q) => `${q.id} (${q.category}) in ${d.id}`),
    );
    expect(misplaced).toEqual([]);
  });

  it("use ids from their deck's range (cards before q1000 predate the ranges)", () => {
    const outside = decks.flatMap((d) => {
      const [lo, hi] = (ranges as unknown as Record<string, number[]>)[d.id] ?? [];
      return files[d.id]
        .map((q) => ({ q, n: Number(q.id.slice(1)) }))
        .filter(({ n }) => n >= 1000 && !(n >= lo && n <= hi))
        .map(({ q }) => `${q.id} in ${d.id} (range q${lo}–q${hi})`);
    });
    expect(outside).toEqual([]);
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
    expect(decks.filter((d) => files[d.id]?.length === 0).map((d) => d.id)).toEqual([]);
  });
});
