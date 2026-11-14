import { useEffect, useRef, useState } from 'preact/hooks';
import { localDayNumber } from './daily';
import type { Question } from './questions';
import CardFace from './CardFace';
import { prefersReducedMotion } from './motion';

export interface HistoryItem {
  at: number;
  q: Question;
}

interface Props {
  open: boolean;
  /** Newest first. */
  items: HistoryItem[];
  today: number;
  onClose: () => void;
  onReturn: (id: string) => void;
  onReturnAll: () => void;
}

const dateFmt = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });

function dayLabel(at: number, today: number): string {
  const day = localDayNumber(new Date(at));
  if (day === today) return 'Hoy';
  if (day === today - 1) return 'Ayer';
  const label = dateFmt.format(new Date(at));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * The cards you've drawn, newest first, as full cards you swipe (or arrow) through.
 * Each can be read again, with its help, and put back into the deck.
 *
 * A native modal <dialog>: focus stays inside while it's open and Escape closes it.
 * Only the card in view is interactive (the rest are inert), so Tab doesn't wander
 * off-screen.
 */
export default function History({ open, items, today, onClose, onReturn, onReturnAll }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [helpFor, setHelpFor] = useState<string | null>(null);
  // "Devolver todas" asks first, in the page: the browser's confirm() is silently
  // blocked in some embedded browsers and installed apps.
  const [confirming, setConfirming] = useState(false);
  const allRef = useRef<HTMLButtonElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = items.length;
  const current = Math.min(index, Math.max(0, count - 1));
  const item = items[current];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Always open on the newest card.
      setIndex(0);
      setHelpFor(null);
      setConfirming(false);
      trackRef.current?.scrollTo({ left: 0 });
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
        if (e.key === 'ArrowLeft') go(current - 1);
        else if (e.key === 'ArrowRight') go(current + 1);
        else return;
        e.preventDefault();
      }}
    >
      <header class="pdd__history-head">
        <h2 id="pdd-history-title" class="pdd__history-title">
          Historial
        </h2>
        {count > 0 && (
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

      {confirming && count > 0 && (
        <div id="pdd-history-confirm" class="pdd__history-confirm" role="group" aria-labelledby="pdd-history-confirm-q">
          <p id="pdd-history-confirm-q">
            ¿Devolver {count === 1 ? 'la carta' : `las ${count} cartas`} a la baraja?
          </p>
          <button type="button" class="pdd__tool" onClick={cancelAll}>
            Cancelar
          </button>
          <button ref={yesRef} type="button" class="pdd__tool pdd__tool--primary" onClick={returnEverything}>
            Devolver todas
          </button>
        </div>
      )}

      {count === 0 ? (
        <p class="pdd__history-empty">Aún no has sacado ninguna carta.</p>
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
                class="pdd__paper pdd__history-card"
                aria-roledescription="carta"
                aria-label={`${i + 1} de ${count}`}
                inert={i !== current}
              >
                <CardFace
                  q={it.q}
                  showHelp={helpFor === it.q.id}
                  onToggleHelp={() => setHelpFor((h) => (h === it.q.id ? null : it.q.id))}
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
            <button type="button" class="pdd__tool pdd__tool--primary" onClick={returnCurrent}>
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
    </dialog>
  );
}
