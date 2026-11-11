import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { questions as defaultQuestions, type Question } from './questions';
import { cardsLeftInCycle, localDayNumber, msUntilNextDay, questionIndexForDay } from './daily';
import { loadState, saveDraw, streakFor } from './storage';
import './styles.css';

export type { Question } from './questions';

export interface PreguntaDelDiaProps {
  /** Replace the built-in deck with your own questions. */
  questions?: Question[];
  /** localStorage key; change it if you run more than one deck on a site. */
  storageKey?: string;
  /** Changes the daily order without changing the questions. */
  salt?: number;
  title?: string;
}

/** loading → (deck → drawing) | drawn */
type Phase = 'loading' | 'deck' | 'drawing' | 'drawn';

const MAX_DECK_LAYERS = 40;

/** Small fixed offsets so the deck's edge looks hand-squared rather than machined. */
function deckJitter(i: number) {
  const n = (i * 2654435761) >>> 0; // cheap deterministic hash, same every render
  return { x: ((n % 7) - 3) * 0.5, r: (((n >>> 3) % 5) - 2) * 0.12 };
}

const dateFmt = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function speak(text: string) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES';
  const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('es'));
  if (voice) u.voice = voice;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

export default function PreguntaDelDia({
  questions = defaultQuestions,
  storageKey = 'pregunta-del-dia',
  salt = 0,
  title = 'Pregunta del día',
}: PreguntaDelDiaProps) {
  const [day, setDay] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [showHelp, setShowHelp] = useState(false);
  // Once today's card is drawn it can be turned back over and face up again.
  const [faceDown, setFaceDown] = useState(false);
  // True until the first paint after loading, so a card that's already drawn
  // appears face up instead of flipping over every time the page opens.
  const [instant, setInstant] = useState(true);
  const [streak, setStreak] = useState(0);
  const [countdown, setCountdown] = useState('');
  const dayRef = useRef<number | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const flipBtnRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Date-dependent state is only computed in the browser, so this is safe to
  // server-render with any Astro client directive.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const today = localDayNumber(now);
      if (dayRef.current !== today) {
        dayRef.current = today;
        const saved = loadState(storageKey);
        setDay(today);
        setPhase(saved.days.includes(today) ? 'drawn' : 'deck');
        setShowHelp(false);
        setFaceDown(false);
        setStreak(streakFor(saved.days, today));
      }
      setCountdown(formatCountdown(msUntilNextDay(now)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [storageKey]);

  const draw = useCallback(() => {
    if (phase !== 'deck' || day === null) return;
    const saved = saveDraw(storageKey, day);
    setStreak(streakFor(saved.days, day));
    setPhase('drawing');
  }, [phase, day, storageKey]);

  const loaded = phase !== 'loading';
  useEffect(() => {
    if (!loaded) return;
    const done = () => setInstant(false);
    // After the first painted frame; the timer covers tabs that don't run frames.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(done);
    });
    const timer = setTimeout(done, 300);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [loaded]);

  const turnOver = useCallback((down: boolean) => {
    moveFocus.current = true;
    setFaceDown(down);
  }, []);

  // Keep keyboard focus on the visible side after a manual flip.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (faceDown ? backRef : flipBtnRef).current?.focus({ preventScroll: true });
  }, [faceDown]);

  const onBackClick = () => {
    if (phase === 'deck') draw();
    else if (phase === 'drawn' && faceDown) turnOver(false);
  };

  const q = day !== null && questions.length ? questions[questionIndexForDay(day, questions.length, salt)] : null;
  const revealed = phase === 'drawing' || phase === 'drawn';
  const flipped = revealed && !faceDown;
  const turnable = phase === 'drawn' && faceDown;
  const left = day !== null ? cardsLeftInCycle(day, questions.length) : questions.length;
  // Always draw the full deck under today's card, whatever is left in the cycle
  // (capped so a very large custom deck stays a sensible height).
  const layers = Math.max(0, Math.min(MAX_DECK_LAYERS, questions.length - 1));

  return (
    <section class="pdd" aria-label={title}>
      <header class="pdd__header">
        <h2 class="pdd__title">{title}</h2>
        {day !== null && <p class="pdd__date">{dateFmt.format(new Date())}</p>}
      </header>

      <div class="pdd__stage" style={{ '--pdd-deck-layers': layers } as any}>
        <div class="pdd__deck" aria-hidden="true">
          {Array.from({ length: layers }, (_, i) => {
            const depth = layers - i; // 1 = just under today's card
            const { x, r } = deckJitter(depth);
            return (
              <div
                key={depth}
                class={depth === 1 ? 'pdd__deck-card pdd__deck-card--top' : 'pdd__deck-card'}
                style={{ '--i': depth, '--x': `${x}px`, '--r': `${r}deg` } as any}
              />
            );
          })}
        </div>

        <div
          class={[
            'pdd__card',
            flipped && 'is-flipped',
            phase === 'drawing' && 'is-drawing',
            phase === 'deck' && 'is-ready',
            instant && 'is-instant',
            turnable && 'is-turnable',
          ]
            .filter(Boolean)
            .join(' ')}
          onAnimationEnd={(e) => e.target === e.currentTarget && phase === 'drawing' && setPhase('drawn')}
        >
          <div class="pdd__card-inner">
            <button
              ref={backRef}
              type="button"
              class="pdd__face pdd__face--back"
              onClick={onBackClick}
              disabled={phase !== 'deck' && !turnable}
              aria-label={turnable ? 'Ver la carta de hoy' : 'Sacar la carta de hoy'}
              inert={flipped}
            >
              <span class="pdd__emblem">¿?</span>
              {phase === 'deck' && <span class="pdd__cta">Toca para sacar tu carta</span>}
              {turnable && <span class="pdd__cta">Toca para ver tu carta</span>}
            </button>

            <article
              class="pdd__face pdd__face--front"
              aria-hidden={!flipped}
              inert={!flipped}
              aria-live="polite"
              onClick={(e) => {
                // Tapping a blank part of the card turns it over; controls and the help text don't.
                if (phase !== 'drawn' || (e.target as Element).closest('button, .pdd__help')) return;
                if (getSelection()?.toString()) return;
                turnOver(true);
              }}
            >
              {q && revealed && (
                <>
                  <div class="pdd__meta">
                    <span class="pdd__chip">{q.category}</span>
                    <span class="pdd__chip pdd__chip--level">{q.level}</span>
                  </div>
                  <p class="pdd__question" lang="es">
                    {q.es}
                  </p>
                  <div class="pdd__actions">
                    {canSpeak && (
                      <button type="button" class="pdd__btn" onClick={() => speak(q.es)}>
                        🔊 Escuchar
                      </button>
                    )}
                    <button
                      type="button"
                      class="pdd__btn"
                      aria-expanded={showHelp}
                      onClick={() => setShowHelp((v) => !v)}
                    >
                      Ayuda
                    </button>
                    <button
                      ref={flipBtnRef}
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
                  </div>
                  {showHelp && (
                    <div class="pdd__help">
                      <p class="pdd__translation" lang="en">
                        {q.en}
                      </p>
                      {q.vocab && q.vocab.length > 0 && (
                        <dl class="pdd__vocab">
                          {q.vocab.map(([es, en]) => (
                            <div key={es}>
                              <dt lang="es">{es}</dt>
                              <dd lang="en">{en}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {q.starter && (
                        <p class="pdd__starter" lang="es">
                          {q.starter}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
        </div>
      </div>

      <footer class="pdd__footer">
        {phase === 'loading' ? (
          <span>&nbsp;</span>
        ) : revealed ? (
          <span>
            Nueva carta en <time class="pdd__countdown">{countdown}</time>
          </span>
        ) : (
          <span>{left === 1 ? '¡Última carta antes de barajar!' : `Quedan ${left} cartas en la baraja`}</span>
        )}
        {streak > 0 && (
          <span class="pdd__streak" title="Días seguidos">
            🔥 {streak} {streak === 1 ? 'día' : 'días'}
          </span>
        )}
      </footer>
    </section>
  );
}
