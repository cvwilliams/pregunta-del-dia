import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { questions as defaultQuestions, type Question } from './questions';
import { ALL_DECK_ID, ALL_DECK_NAME, cardsInDeck, decks as defaultDecks, type Deck } from './decks';
import {
  clearTable,
  cryptoRng,
  draw as drawCard,
  drawDays,
  remaining,
  returnAll,
  returnCard,
  selectDeck,
  shuffle as shuffleDeck,
  type DeckState,
} from './deck';
import { localDayNumber } from './daily';
import { afterPaint, prefersReducedMotion } from './motion';
import { SHUFFLE_CARDS, runShuffle } from './shuffle';
import { loadState, saveState, streakFor } from './storage';
import DeckTray from './DeckTray';
import History from './History';
import CardFace from './CardFace';
import './styles.css';

export type { Question } from './questions';
export type { Deck } from './decks';

export interface PreguntaDelDiaProps {
  /** Replace the built-in questions with your own. Each needs a unique, stable `id`. */
  questions?: Question[];
  /** Themed decks, each a list of categories. A combined "Todas" deck is always added. */
  decks?: Deck[];
  /** localStorage key; change it if you run more than one deck on a site. */
  storageKey?: string;
  title?: string;
  /** Heading level for the title: 2 inside a page (default), 1 when the deck is the whole page. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

/** loading → deck → drawing → drawn → (discarding → drawing | deck) */
type Phase = 'loading' | 'deck' | 'drawing' | 'drawn' | 'discarding';

const MAX_DECK_LAYERS = 40;

/** Small fixed offsets so the deck's edge looks hand-squared rather than machined. */
function deckJitter(i: number) {
  const n = (i * 2654435761) >>> 0; // cheap deterministic hash, same every render
  return { x: ((n % 7) - 3) * 0.5, r: (((n >>> 3) % 5) - 2) * 0.12 };
}

/** How long the face-up card takes to turn over (matches the CSS transition). */
const TURN_MS = 750;
/** The draw animation is 1.6s; if its end event never arrives, finish anyway. */
const DRAW_FALLBACK_MS = 2200;
/** Same for the card being slid off the table (0.45s). */
const DISCARD_FALLBACK_MS = 900;
/** And for the riffle (2.6s). */
const SHUFFLE_FALLBACK_MS = 3400;

const cartas = (n: number) => `${n} ${n === 1 ? 'carta' : 'cartas'}`;

export default function PreguntaDelDia({
  questions = defaultQuestions,
  decks = defaultDecks,
  storageKey = 'pregunta-del-dia',
  title = 'Pregunta del día',
  headingLevel = 2,
}: PreguntaDelDiaProps) {
  const Heading = `h${headingLevel}` as 'h2';

  // Everything below depends on the browser (date, storage, randomness), so it
  // starts empty and fills in after mount. That keeps it safe to server-render.
  const [state, setState] = useState<DeckState | null>(null);
  const stateRef = useRef<DeckState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [phase, setPhase] = useState<Phase>('loading');
  const [showHelp, setShowHelp] = useState(false);
  // A card on the table can be turned back over and face up again.
  const [faceDown, setFaceDown] = useState(false);
  // While true the card snaps to its state with no transition: on page load (so a
  // drawn card doesn't flip over every visit) and when it's cleared off the table.
  const [instant, setInstant] = useState(true);
  const [shuffling, setShuffling] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const backRef = useRef<HTMLButtonElement>(null);
  const questionRef = useRef<HTMLParagraphElement>(null);
  const emptyRef = useRef<HTMLButtonElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const shuffleRef = useRef<HTMLDivElement>(null);
  const shuffleTimer = useRef<ReturnType<typeof setTimeout>>();

  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const allIds = useMemo(() => questions.map((q) => q.id), [questions]);
  // Todas first, then the themed decks; each with the ids of its cards.
  const allDecks = useMemo(
    () =>
      [{ id: ALL_DECK_ID, name: ALL_DECK_NAME } as Deck, ...decks].map((d) => ({
        ...d,
        cards: cardsInDeck(d.id, decks, questions),
      })),
    [decks, questions],
  );
  const cardsOf = (id: string) => allDecks.find((d) => d.id === id)?.cards ?? new Set<string>();

  const commit = (next: DeckState) => {
    stateRef.current = next;
    setState(next);
    saveState(storageKey, next);
  };

  // Load (or start) the viewer's deck.
  useEffect(() => {
    let s = loadState(storageKey, allIds, ALL_DECK_ID, cryptoRng);
    if (!allDecks.some((d) => d.id === s.deckId)) s = selectDeck(s, ALL_DECK_ID);
    commit(s);
    setPhase(s.current ? 'drawn' : 'deck');
    setInstant(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, allIds, allDecks]);

  // Notice when the day changes, for the streak and the history's "Hoy" / "Ayer".
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Let a snapped card paint once, then turn transitions back on.
  useEffect(() => (instant ? afterPaint(() => setInstant(false), 300) : undefined), [instant]);

  const today = localDayNumber(new Date(now));
  const deckId = state?.deckId ?? ALL_DECK_ID;
  const cards = cardsOf(deckId);
  const left = state ? remaining(state, cards) : 0;
  const streak = state ? streakFor(drawDays(state), today) : 0;
  const q = state?.current ? byId.get(state.current) ?? null : null;
  const onTable = phase === 'drawing' || phase === 'drawn' || phase === 'discarding';
  const empty = phase === 'deck' && left === 0;
  const canDraw = phase === 'deck' && left > 0 && !shuffling;
  const busy = phase === 'loading' || phase === 'drawing' || phase === 'discarding' || shuffling;

  const draw = () => {
    const s = stateRef.current;
    const next = s && drawCard(s, cardsOf(s.deckId), localDayNumber(), Date.now());
    if (!next) return;
    commit(next);
    setShowHelp(false);
    setFaceDown(false);
    // The button that was pressed turns away with the card; send focus to the question.
    moveFocus.current = true;
    setPhase('drawing');
  };

  // Clear the face-up card off the table (it stays in the history).
  const putAway = () => {
    if (stateRef.current) commit(clearTable(stateRef.current));
    setFaceDown(false);
    setShowHelp(false);
    setInstant(true);
    setPhase('deck');
  };

  // Slide the current card off the table, then draw the next one (or show the empty spot).
  const another = () => {
    if (phase !== 'drawn') return;
    moveFocus.current = true;
    if (prefersReducedMotion()) finishDiscard();
    else setPhase('discarding');
  };

  const finishDiscard = () => {
    putAway();
    const s = stateRef.current;
    // Wait for the snapped card to paint face down on the deck before drawing it.
    if (s && remaining(s, cardsOf(s.deckId)) > 0) afterPaint(draw);
  };

  // The draw and discard normally finish on their animation's end event. If that
  // never arrives (animations disabled, tab frozen mid-way), don't leave it stuck.
  useEffect(() => {
    if (phase === 'drawing') {
      const t = setTimeout(() => setPhase((p) => (p === 'drawing' ? 'drawn' : p)), DRAW_FALLBACK_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'discarding') {
      const t = setTimeout(finishDiscard, DISCARD_FALLBACK_MS);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const turnOver = (down: boolean) => {
    moveFocus.current = true;
    setFaceDown(down);
  };

  // Keep focus on what's visible after drawing, turning or clearing the card: the
  // question when it's face up (so it's read out), otherwise the card's back, or
  // the "put them back" button when the deck is empty.
  useEffect(() => {
    // Mid-animation the target may be hidden; this runs again when it ends.
    if (!moveFocus.current || phase === 'discarding' || phase === 'loading' || shuffling) return;
    moveFocus.current = false;
    const target = onTable && !faceDown ? questionRef : empty ? emptyRef : backRef;
    target.current?.focus({ preventScroll: true });
  }, [faceDown, phase, empty, onTable, shuffling]);

  // Shuffle the selected deck for real, with the riffle to show it.
  const shuffle = () => {
    if (!stateRef.current || busy || left < 2) return;
    const reduce = prefersReducedMotion();
    const run = () => {
      const s = stateRef.current!;
      commit(shuffleDeck(s, cardsOf(s.deckId), cryptoRng));
      setAnnouncement('Baraja barajada');
      // Without motion, just a brief dip so the tap is acknowledged.
      if (reduce) stageRef.current?.animate([{ opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }], { duration: 300 });
      else setShuffling(true);
      // Hidden behind the riffle, the card goes back to sitting face down on the deck.
      putAway();
    };
    // You shuffle a deck, not a revealed card: turn it face down first.
    if (phase === 'drawn' && !faceDown && !reduce) {
      setFaceDown(true);
      shuffleTimer.current = setTimeout(run, TURN_MS);
    } else run();
  };

  useEffect(() => () => clearTimeout(shuffleTimer.current), []);

  const layers = Math.max(0, Math.min(MAX_DECK_LAYERS, cards.size - 1));

  // Play the riffle on the stand-in cards, then hand back to the real deck.
  useEffect(() => {
    if (!shuffling) return;
    const stage = stageRef.current;
    const pile = shuffleRef.current;
    if (!stage || !pile) return;
    const { width, height } = stage.getBoundingClientRect();
    const depth = parseFloat(getComputedStyle(stage).getPropertyValue('--pdd-deck-step')) * layers || 0;
    // Rendered deepest first, so reverse to get the top card first.
    const stand = Array.from(pile.children).reverse() as HTMLElement[];
    const run = runShuffle(stand, { width, height, depth });
    let live = true;
    run.finished.then(() => live && setShuffling(false), () => {});
    // Like the draw: if the animation stalls (frozen tab), don't leave the deck hidden.
    const fallback = setTimeout(() => live && setShuffling(false), SHUFFLE_FALLBACK_MS);
    return () => {
      live = false;
      clearTimeout(fallback);
      run.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffling]);

  const chooseDeck = (id: string) => {
    const s = stateRef.current;
    if (!s || busy) return;
    commit(selectDeck(s, id));
    putAway();
    const n = remaining(s, cardsOf(id));
    setAnnouncement(`${allDecks.find((d) => d.id === id)?.name}: ${n === 1 ? 'queda' : 'quedan'} ${cartas(n)}`);
  };

  const putBack = (id: string) => {
    const s = stateRef.current;
    if (!s) return;
    const wasCurrent = s.current === id;
    commit(returnCard(s, id, cryptoRng));
    if (wasCurrent) putAway();
    setAnnouncement('Carta devuelta a la baraja');
  };

  const putAllBack = (deck: string, focusDeck = false) => {
    const s = stateRef.current;
    if (!s) return;
    // From the empty spot, its button disappears; land on the refilled deck instead.
    if (focusDeck) moveFocus.current = true;
    commit(returnAll(s, cardsOf(deck), cryptoRng));
    putAway();
    setAnnouncement('Cartas devueltas y barajadas');
    if (!prefersReducedMotion()) setShuffling(true);
  };

  const onBackClick = () => {
    if (canDraw) draw();
    else if (phase === 'drawn' && faceDown) turnOver(false);
  };

  const flipped = onTable && !faceDown;
  const turnable = phase === 'drawn' && faceDown;

  const choices = allDecks.map((d) => ({ ...d, left: state ? remaining(state, d.cards) : 0 }));
  // The selected deck's colours, set on the stage so the deck, the card's back and
  // the shuffle match. Not on the whole component: the tray's packs would inherit
  // them, and Todas (which has no colours of its own) would turn the active colour.
  const back = allDecks.find((d) => d.id === deckId)?.back;

  const historyItems = state
    ? state.history
        .slice()
        .reverse()
        .flatMap((h) => {
          const hq = byId.get(h.id);
          return hq ? [{ at: h.at, q: hq }] : [];
        })
    : [];

  let backCta: string | null = null;
  if (turnable) backCta = 'Toca para ver tu carta';
  else if (canDraw) backCta = 'Toca para sacar una carta';

  return (
    <section class="pdd" aria-label={title}>
      <header class="pdd__header">
        <Heading class="pdd__title">{title}</Heading>
      </header>

      <div
        ref={stageRef}
        class={shuffling ? 'pdd__stage is-shuffling' : 'pdd__stage'}
        style={{
          '--pdd-deck-layers': empty ? 0 : layers,
          ...(back && { '--pdd-back-1': back[0], '--pdd-back-2': back[1] }),
        }}
      >
        {empty ? (
          <div class="pdd__empty">
            <p>No quedan cartas en esta baraja.</p>
            <button ref={emptyRef} type="button" class="pdd__tool pdd__tool--primary" onClick={() => putAllBack(deckId, true)}>
              Devolver todas y barajar
            </button>
          </div>
        ) : (
          <>
            <div class="pdd__deck" aria-hidden="true">
              {Array.from({ length: layers }, (_, i) => {
                const depth = layers - i; // 1 = just under the top card
                const { x, r } = deckJitter(depth);
                return (
                  <div
                    key={depth}
                    class={depth === 1 ? 'pdd__deck-card pdd__deck-card--top' : 'pdd__deck-card'}
                    style={{ '--i': depth, '--x': `${x}px`, '--r': `${r}deg` } as any}
                  >
                    {depth === 1 && <span class="pdd__emblem">¿?</span>}
                  </div>
                );
              })}
            </div>

            {shuffling && (
              <div class="pdd__shuffle" ref={shuffleRef} aria-hidden="true">
                {Array.from({ length: SHUFFLE_CARDS }, (_, i) => (
                  <div key={i} class="pdd__shuffle-card">
                    <span class="pdd__emblem">¿?</span>
                  </div>
                ))}
              </div>
            )}

            <div
              class={[
                'pdd__card',
                flipped && 'is-flipped',
                phase === 'drawing' && 'is-drawing',
                phase === 'discarding' && 'is-discarding',
                canDraw && 'is-ready',
                instant && 'is-instant',
                turnable && 'is-turnable',
              ]
                .filter(Boolean)
                .join(' ')}
              onAnimationEnd={(e) => {
                if (e.target !== e.currentTarget) return;
                if (phase === 'drawing') setPhase('drawn');
                else if (phase === 'discarding') finishDiscard();
              }}
            >
              <div class="pdd__card-inner">
                <button
                  ref={backRef}
                  type="button"
                  class="pdd__face pdd__face--back"
                  onClick={onBackClick}
                  disabled={!canDraw && !turnable}
                  // Its name is the visible prompt, so voice control can use what's on screen.
                  aria-label={backCta ? undefined : 'Baraja'}
                  inert={flipped}
                >
                  <span class="pdd__emblem" aria-hidden="true">¿?</span>
                  {backCta && <span class="pdd__cta">{backCta}</span>}
                </button>

                <article
                  class="pdd__face pdd__face--front pdd__paper"
                  aria-hidden={!flipped}
                  inert={!flipped}
                  onClick={(e) => {
                    // Tapping a blank part of the card turns it over; controls and the help text don't.
                    if (phase !== 'drawn' || (e.target as Element).closest('button, .pdd__help')) return;
                    if (getSelection()?.toString()) return;
                    turnOver(true);
                  }}
                >
                  {q && onTable && (
                    <CardFace
                      q={q}
                      showHelp={showHelp}
                      onToggleHelp={() => setShowHelp((v) => !v)}
                      questionRef={questionRef}
                    >
                      <button
                        type="button"
                        class="pdd__btn pdd__btn--icon"
                        aria-label="Dar la vuelta a la carta"
                        title="Dar la vuelta"
                        disabled={phase !== 'drawn'}
                        onClick={() => turnOver(true)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
                          <path d="M3 21v-5h5" />
                        </svg>
                      </button>
                    </CardFace>
                  )}
                </article>
              </div>
            </div>
          </>
        )}
      </div>

      <footer class="pdd__footer">
        <span>
          {phase === 'loading' ? '\u00a0' : left === 0 ? 'No quedan cartas' : `${left === 1 ? 'Queda' : 'Quedan'} ${cartas(left)}`}
        </span>
        {streak > 0 && (
          <span class="pdd__streak">
            <span aria-hidden="true">🔥 </span>
            <span class="pdd__sr-only">Racha: </span>
            {streak} {streak === 1 ? 'día' : 'días'}
          </span>
        )}
      </footer>

      <div class="pdd__tools">
        {phase === 'drawn' && !faceDown && (
          <button type="button" class="pdd__tool pdd__tool--primary" onClick={another}>
            Otra carta
          </button>
        )}
        <button type="button" class="pdd__tool" onClick={shuffle} disabled={left < 2} aria-disabled={busy || undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M16 3h5v5" />
            <path d="M4 20 21 3" />
            <path d="M21 16v5h-5" />
            <path d="m15 15 6 6" />
            <path d="M4 4l5 5" />
          </svg>
          Barajar
        </button>
        <button
          ref={historyBtnRef}
          type="button"
          class="pdd__tool"
          onClick={() => setHistoryOpen(true)}
          disabled={phase === 'loading'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3 2" />
          </svg>
          {/* On narrow screens only the icon and count show; the word stays for screen readers. */}
          <span class="pdd__tool-label">Historial</span>
          <span class="pdd__tool-count">{state?.history.length ?? 0}</span>
        </button>
      </div>

      <DeckTray choices={choices} selected={deckId} busy={busy} onSelect={chooseDeck} />

      <p class="pdd__sr-only" role="status">
        {announcement}
      </p>

      <History
        open={historyOpen}
        items={historyItems}
        today={today}
        onClose={() => {
          setHistoryOpen(false);
          // Back to the button that opened it (the browser only does this if the
          // previously focused element is still focusable).
          historyBtnRef.current?.focus();
        }}
        onReturn={putBack}
        onReturnAll={() => putAllBack(ALL_DECK_ID)}
      />
    </section>
  );
}
