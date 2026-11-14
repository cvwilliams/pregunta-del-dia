// Progress towards the full deck: cards per deck and level against the targets.
// Run with `npm run stats` (or `make stats`).
import { readdirSync, readFileSync } from 'node:fs';

const TOTAL = 3000;
// Weighted to the middle, where most learners are.
const MIX = { A1: 0.15, A2: 0.25, B1: 0.25, B2: 0.2, C1: 0.15 };
const LEVELS = Object.keys(MIX);

const dir = new URL('../src/PreguntaDelDia/questions/', import.meta.url);
const decks = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ id: f.replace('.json', ''), cards: JSON.parse(readFileSync(new URL(f, dir), 'utf8')) }));

const perDeck = Math.round(TOTAL / decks.length);
const pad = (s, n) => String(s).padStart(n);
const cell = (have, want) => pad(`${have}/${want}`, 9);

console.log(`${'deck'.padEnd(14)}${LEVELS.map((l) => pad(l, 9)).join('')}${pad('total', 10)}`);
for (const d of decks) {
  const row = LEVELS.map((l) => cell(d.cards.filter((q) => q.level === l).length, Math.round(perDeck * MIX[l])));
  console.log(`${d.id.padEnd(14)}${row.join('')}${pad(`${d.cards.length}/${perDeck}`, 10)}`);
}
const all = decks.flatMap((d) => d.cards);
const totals = LEVELS.map((l) => cell(all.filter((q) => q.level === l).length, Math.round(TOTAL * MIX[l])));
console.log(`${'all'.padEnd(14)}${totals.join('')}${pad(`${all.length}/${TOTAL}`, 10)}`);

// Each deck takes new ids from its own range (scripts/question-ranges.json).
const ranges = JSON.parse(readFileSync(new URL('./question-ranges.json', import.meta.url), 'utf8'));
console.log('\nnext id per deck:');
for (const d of decks) {
  const [lo, hi] = ranges[d.id];
  const used = d.cards.map((q) => Number(q.id.slice(1))).filter((n) => n >= lo && n <= hi);
  const next = used.length ? Math.max(...used) + 1 : lo;
  console.log(`  ${d.id.padEnd(14)}q${String(next).padStart(4, '0')}  (range q${lo}–q${hi})`);
}
