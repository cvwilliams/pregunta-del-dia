import { describe, expect, it } from 'vitest';
import { dayLabel, groupByDay, localDayNumber } from '../src/PreguntaDelDia/daily';

// Local times, so the tests hold in any time zone.
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const today = localDayNumber(new Date(2026, 10, 20)); // Friday 20 November 2026

describe('dayLabel', () => {
  it('says Hoy and Ayer', () => {
    expect(dayLabel(at(2026, 11, 20, 0, 1), today)).toBe('Hoy');
    expect(dayLabel(at(2026, 11, 20, 23, 59), today)).toBe('Hoy');
    expect(dayLabel(at(2026, 11, 19, 23, 59), today)).toBe('Ayer');
  });

  it('gives older days as a capitalised date', () => {
    expect(dayLabel(at(2026, 11, 16), today)).toBe('Lunes, 16 de noviembre');
  });

  it('adds the year for an earlier year', () => {
    expect(dayLabel(at(2025, 11, 17), today)).toBe('Lunes, 17 de noviembre de 2025');
  });
});

describe('groupByDay', () => {
  it('splits a newest-first list at local midnight, keeping each item’s index', () => {
    const items = [at(2026, 11, 20, 0, 1), at(2026, 11, 19, 23, 59), at(2026, 11, 19, 8), at(2026, 11, 16)];
    const groups = groupByDay(items, (t) => t, today);
    expect(groups.map((g) => g.label)).toEqual(['Hoy', 'Ayer', 'Lunes, 16 de noviembre']);
    expect(groups.map((g) => g.rows.map((r) => r.index))).toEqual([[0], [1, 2], [3]]);
  });

  it('keeps the same date in different years apart', () => {
    const groups = groupByDay([at(2026, 11, 16), at(2025, 11, 16)], (t) => t, today);
    expect(groups).toHaveLength(2);
    expect(new Set(groups.map((g) => g.day)).size).toBe(2);
  });

  it('gives nothing for no items', () => {
    expect(groupByDay([], (t: number) => t, today)).toEqual([]);
  });
});
