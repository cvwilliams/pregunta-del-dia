"""Append a batch of new cards to a deck, giving them the next ids from the deck's range.

Usage (from the repo root):
    python3 scripts/add_questions.py <deck-id> <batch.py>

The batch file is plain Python defining
    CARDS = [(level, category, es, en, [(es, en), ...], starter), ...]

It refuses the whole batch if a card repeats an existing question, uses a category
the deck doesn't have, or is missing a field. `npm test` runs the full checks after.
See docs/writing-questions.md for the writing standard.
"""
import json
import re
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QDIR = ROOT / 'src/PreguntaDelDia/questions'
LEVELS = {'A1', 'A2', 'B1', 'B2', 'C1'}

deck, batch = sys.argv[1], sys.argv[2]
cards = runpy.run_path(batch)['CARDS']
lo, hi = json.loads((ROOT / 'scripts/question-ranges.json').read_text())[deck]


def read(path: Path) -> list[dict]:
    return [json.loads(line.strip().rstrip(',')) for line in path.read_text().splitlines() if line.strip().startswith('{')]


def norm(s: str) -> str:
    return ' '.join(re.sub(r'[^\w\s]', ' ', s.lower()).split())


existing = [q for f in QDIR.glob('*.json') for q in read(f)]
seen = {norm(q['es']) for q in existing}
used = [n for n in (int(q['id'][1:]) for q in existing) if lo <= n <= hi]
next_id = max(used) + 1 if used else lo

decks_ts = (ROOT / 'src/PreguntaDelDia/decks.ts').read_text()
block = decks_ts[decks_ts.index(f"id: '{deck}'"):]
allowed = set(re.findall(r"'([^']+)'", block[block.index('categories: [') : block.index(']')]))

def filled(s) -> bool:
    return isinstance(s, str) and s.strip() != ''


def punctuated(es: str, en: str) -> bool:
    """Same rule as the tests: ¿…? questions (¿ may open mid-sentence), or prompts ending in a full stop."""
    return (es.endswith('?') and '¿' in es and en.endswith('?')) or (
        es.endswith('.') and '¿' not in es and en.endswith('.'))


new = []
for level, category, es, en, vocab, starter in cards:
    problems = []
    if not filled(es):
        problems.append('needs the Spanish question')
    elif norm(es) in seen:
        problems.append('repeats an existing question')
    if not filled(en):
        problems.append('needs the English translation')
    if filled(es) and filled(en) and not punctuated(es.strip(), en.strip()):
        problems.append('punctuation: ¿…? and …? for questions, a full stop in both for prompts')
    if category not in allowed:
        problems.append(f'category {category!r} is not in {deck}: {sorted(allowed)}')
    if level not in LEVELS:
        problems.append(f'level {level!r}')
    if not 2 <= len(vocab) <= 4:
        problems.append('needs 2–4 vocab pairs')
    if not all(len(pair) == 2 and filled(pair[0]) and filled(pair[1]) for pair in vocab):
        problems.append('every vocab pair needs both the Spanish and the English')
    if not filled(starter):
        problems.append('needs a starter')
    if problems:
        sys.exit(f'Not added (nothing was written): {es}\n  ' + '\n  '.join(problems))
    seen.add(norm(es))
    new.append({'id': f'q{next_id:04d}', 'es': es, 'en': en, 'level': level, 'category': category,
                'vocab': [list(p) for p in vocab], 'starter': starter})
    next_id += 1

if next_id - 1 > hi:
    sys.exit(f'Out of ids: {deck} only has q{lo}–q{hi}. Nothing was written.')

path = QDIR / f'{deck}.json'
lines = ['  ' + json.dumps(q, ensure_ascii=False) for q in read(path) + new]
path.write_text('[\n' + ',\n'.join(lines) + '\n]\n')
print(f'{deck}: +{len(new)} ({new[0]["id"]}–{new[-1]["id"]}), now {len(lines)} cards')
