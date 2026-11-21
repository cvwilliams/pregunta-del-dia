import { useEffect, useRef, useState } from 'preact/hooks';
import { dayLabel, groupByDay } from './daily';
import type { Question } from './questions';
import CardFace, { StarIcon } from './CardFace';
import { afterPaint, prefersReducedMotion } from './motion';
import { springBack, useSwipe } from './swipe';

export interface HistoryItem {
  at: number;
  q: Question;
  saved: boolean;
  /** Its deck's card-back colour, for the list; the theme's when left out. */
  back?: string;
}

interface Props {
  open: boolean;
  /** Newest first. */
  items: HistoryItem[];
  today: number;
  onClose: () => void;
  onReturn: (id: string) => void;
  onReturnAll: () => void;
  onToggleSaved: (id: string) => void;
  /** What the last return did ("Carta devuelta a la baraja"), while it can be undone. */
  undoLabel: string | null;
  onUndo: () => void;
}

type View = 'cards' | 'list';

/**
 * The cards you've drawn, newest first: as full cards you swipe (or arrow) through,
 * or as a list to scan and jump from. Each can be read again with its help, saved
 * (★) to come back to, and put back into the deck; a return can be undone.
 *
 * A native modal <dialog>: focus stays inside while it's open and Escape closes it.
 * In the card view only the card in view is interactive (the rest are inert), so
 * Tab doesn't wander off-screen.
 */
export default function History({
  open,
  items: allItems,
  today,
  onClose,
  onReturn,
  onReturnAll,
  onToggleSaved,
  undoLabel,
  onUndo,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>('cards');
  const [onlySaved, setOnlySaved] = useState(false);
  const [index, setIndex] = useState(0);
  const [helpFor, setHelpFor] = useState<string | null>(null);
  // "Devolver todas" asks first, in the page: the browser's confirm() is silently
  // blocked in some embedded browsers and installed apps.
  const [confirming, setConfirming] = useState(false);
  // The card in view has more text than fits (the help, or a short screen), so a
  // vertical drag scrolls it instead of putting it back.
  const [scrolls, setScrolls] = useState(false);
  const allRef = useRef<HTMLButtonElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnRef = useRef<HTMLButtonElement>(null);

  const savedCount = allItems.filter((it) => it.saved).length;
  const items = onlySaved ? allItems.filter((it) => it.saved) : allItems;
  const count = items.length;
  const current = Math.min(index, Math.max(0, count - 1));
  const item = items[current];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Always open on the newest card, unfiltered (the view you last used is kept).
      setIndex(0);
      setOnlySaved(false);
      setHelpFor(null);
      setConfirming(false);
      trackRef.current?.scrollTo({ left: 0 });
      listRef.current?.scrollTo({ top: 0 });
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The distance from one card to the next in the track.
  const stride = () => {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    if (!track || !first) return 1;
    return first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
  };

  const go = (i: number) => {
    const next = Math.max(0, Math.min(count - 1, i));
    setIndex(next);
    trackRef.current?.scrollTo({ left: next * stride(), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  // Swiping or scrolling the track picks the card that's centred.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / stride());
    if (i >= 0 && i < count) setIndex(i);
  };

  // The track is new each time the card view comes back (from the list, or a new
  // filter): put the chosen card in the middle straight away.
  useEffect(() => {
    if (view === 'cards') trackRef.current?.scrollTo({ left: current * stride() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, onlySaved]);

  useEffect(() => {
    if (!open || view !== 'cards') return;
    const check = () => {
      const body = trackRef.current?.querySelector<HTMLElement>('.pdd__history-card:not([inert]) .pdd__paper-body');
      setScrolls(!!body && body.scrollHeight > body.clientHeight + 1);
    };
    const cancel = afterPaint(check);
    addEventListener('resize', check);
    return () => {
      cancel();
      removeEventListener('resize', check);
    };
  }, [open, view, current, helpFor, count]);

  useEffect(() => {
    if (confirming) yesRef.current?.focus();
  }, [confirming]);

  const cancelAll = () => {
    setConfirming(false);
    allRef.current?.focus();
  };

  const returnEverything = () => {
    setConfirming(false);
    onReturnAll();
    // The cards (and this button) are gone; the close button is what's left.
    closeRef.current?.focus();
  };

  const returnCurrent = () => {
    if (!item) return;
    onReturn(item.q.id);
    // The next older card slides into this place; past the end, step back one.
    if (current >= count - 1 && current > 0) setIndex(current - 1);
  };

  const undo = () => {
    onUndo();
    // The card comes back where it was; land on what's showing.
    setIndex(current);
    afterPaint(() => (view === 'cards' ? returnRef.current : listRef.current)?.focus());
  };

  const showView = (v: View) => {
    setView(v);
    setHelpFor(null);
  };

  const filterSaved = (on: boolean) => {
    setOnlySaved(on);
    setIndex(0);
    setHelpFor(null);
    listRef.current?.scrollTo({ top: 0 });
  };

  // From the list, open that card in the card view.
  const openCard = (i: number) => {
    setIndex(i);
    showView('cards');
    afterPaint(() => returnRef.current?.focus());
  };

  // Swipe the card in view up to put it back in the deck. Sideways still moves between
  // cards, and down only gives a little (it never closes the dialog). When the card's
  // text scrolls, up and down scroll it instead, so it's left alone then.
  useSwipe(ref, {
    axis: 'y',
    handle: '.pdd__history-card:not([inert])',
    allow: (dir) => dir === -1,
    enabled: (el) => !confirming && !el.classList.contains('is-scrollable'),
    onMove: (el, { d, size }) => {
      el.style.transform = `translateY(${d}px)`;
      el.style.opacity = d < 0 ? String(Math.max(0.3, 1 + (d / size) * 0.7)) : '';
    },
    onRelease: (el, dir) => {
      const reduce = prefersReducedMotion();
      if (!dir) return springBack(el, reduce);
      if (reduce) return returnCurrent();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        returnCurrent();
      };
      // One keyframe: it starts from wherever the card was let go.
      el.animate([{ transform: 'translateY(-120%)', opacity: 0 }], {
        duration: 220,
        easing: 'ease-in',
        fill: 'forwards',
      }).finished.then(finish, finish);
      setTimeout(finish, 500); // in case the animation never finishes (hidden tab)
    },
  });

  const total = allItems.length;

  return (
    <dialog
      ref={ref}
      class="pdd__history"
      aria-labelledby="pdd-history-title"
      onClose={onClose}
      onCancel={(e) => {
        // Escape backs out of the confirmation first, then closes.
        if (!confirming) return;
        e.preventDefault();
        cancelAll();
      }}
      onKeyDown={(e) => {
        if (view !== 'cards' || (e.target as Element).closest('.pdd__history-bar, .pdd__history-undo')) return;
        if (e.key === 'ArrowLeft') go(current - 1);
        else if (e.key === 'ArrowRight') go(current + 1);
        else if (e.key === 'Home') go(0);
        else if (e.key === 'End') go(count - 1);
        else return;
        e.preventDefault();
      }}
    >
      <header class="pdd__history-head">
        <h2 id="pdd-history-title" class="pdd__history-title">
          Historial
        </h2>
        {total > 0 && (
          <button
            ref={allRef}
            type="button"
            class="pdd__tool"
            aria-expanded={confirming}
            aria-controls="pdd-history-confirm"
            onClick={() => setConfirming(true)}
          >
            Devolver todas
          </button>
        )}
        <button ref={closeRef} type="button" class="pdd__tool pdd__history-close" aria-label="Cerrar" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      {confirming && total > 0 && (
        <div id="pdd-history-confirm" class="pdd__history-confirm" role="group" aria-labelledby="pdd-history-confirm-q">
          <p id="pdd-history-confirm-q">
            ¿Devolver {total === 1 ? 'la carta' : `las ${total} cartas`} a la baraja?
          </p>
          <button type="button" class="pdd__tool" onClick={cancelAll}>
            Cancelar
          </button>
          <button ref={yesRef} type="button" class="pdd__tool pdd__tool--primary" onClick={returnEverything}>
            Devolver todas
          </button>
        </div>
      )}

      {total > 0 && (
        <div class="pdd__history-bar">
          <div class="pdd__segmented" role="group" aria-label="Ver como">
            <button type="button" aria-pressed={view === 'cards'} onClick={() => showView('cards')}>
              Cartas
            </button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => showView('list')}>
              Lista
            </button>
          </div>
          <button
            type="button"
            class="pdd__tool pdd__filter"
            aria-pressed={onlySaved}
            onClick={() => filterSaved(!onlySaved)}
          >
            <StarIcon filled={onlySaved} />
            Guardadas
            <span class="pdd__tool-count">{savedCount}</span>
          </button>
        </div>
      )}

      {total === 0 ? (
        <p class="pdd__history-empty">Aún no has sacado ninguna carta.</p>
      ) : count === 0 ? (
        <p class="pdd__history-empty">
          Aún no has guardado ninguna carta.
          <br />
          Toca <StarIcon /> en una carta para guardarla.
        </p>
      ) : view === 'list' ? (
        <div class="pdd__history-list" ref={listRef} tabIndex={-1} aria-label={`${count} ${count === 1 ? 'carta' : 'cartas'}`}>
          {groupByDay(items, (it) => it.at, today).map((g) => (
            <section key={g.day} class="pdd__history-day">
              <h3>{g.label}</h3>
              <ul>
                {g.rows.map(({ item: it, index: i }) => (
                  <li
                    key={it.q.id}
                    class="pdd__history-row"
                    style={it.back ? { '--pdd-row-back': it.back } : undefined}
                  >
                    <button type="button" class="pdd__history-open" onClick={() => openCard(i)}>
                      <span class="pdd__history-q" id={`pdd-hq-${it.q.id}`} lang="es">
                        {it.q.es}
                      </span>
                      <span class="pdd__history-meta">
                        {it.q.category} · {it.q.level}
                      </span>
                    </button>
                    <button
                      type="button"
                      class="pdd__star"
                      aria-pressed={it.saved}
                      aria-label="Guardar"
                      aria-describedby={`pdd-hq-${it.q.id}`}
                      title={it.saved ? 'Quitar de guardadas' : 'Guardar'}
                      onClick={() => onToggleSaved(it.q.id)}
                    >
                      <StarIcon filled={it.saved} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <>
          <p class="pdd__history-where" aria-live="polite">
            <span>{dayLabel(item.at, today)}</span>
            <span class="pdd__history-pos">
              {current + 1} de {count}
            </span>
          </p>

          <div class="pdd__history-track" ref={trackRef} onScroll={onScroll}>
            {items.map((it, i) => (
              <article
                key={it.q.id}
                class={i === current && scrolls ? 'pdd__paper pdd__history-card is-scrollable' : 'pdd__paper pdd__history-card'}
                aria-roledescription="carta"
                aria-label={`${i + 1} de ${count}`}
                inert={i !== current}
              >
                <CardFace
                  q={it.q}
                  showHelp={helpFor === it.q.id}
                  onToggleHelp={() => setHelpFor((h) => (h === it.q.id ? null : it.q.id))}
                  saved={it.saved}
                  onToggleSaved={() => onToggleSaved(it.q.id)}
                />
              </article>
            ))}
          </div>

          <div class="pdd__history-nav">
            <button
              type="button"
              class="pdd__tool pdd__history-arrow"
              aria-label="Carta anterior"
              aria-disabled={current === 0 || undefined}
              onClick={() => go(current - 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button ref={returnRef} type="button" class="pdd__tool pdd__tool--primary" onClick={returnCurrent}>
              Devolver a la baraja
            </button>
            <button
              type="button"
              class="pdd__tool pdd__history-arrow"
              aria-label="Carta siguiente"
              aria-disabled={current >= count - 1 || undefined}
              onClick={() => go(current + 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* After putting cards back: say so, with a way to take it back. It stays until
          something else changes or the history closes, so there's no rush. */}
      <div class="pdd__history-undo" role="status">
        {undoLabel && (
          <>
            <span>{undoLabel}</span>
            <button type="button" class="pdd__undo-btn" onClick={undo}>
              Deshacer
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
