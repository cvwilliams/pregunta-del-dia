import { useEffect, useRef } from 'preact/hooks';
import { prefersReducedMotion } from './motion';

export interface DeckChoice {
  id: string;
  name: string;
  /** Undrawn cards left in this deck. */
  left: number;
  /** Card-back colours [lighter, darker]; omitted for the theme's default back. */
  back?: [string, string];
}

interface Props {
  choices: DeckChoice[];
  selected: string;
  /** While the card is moving: clicks are ignored, but focus isn't lost. */
  busy?: boolean;
  onSelect: (id: string) => void;
}

const backStyle = (back?: [string, string]) =>
  back ? ({ '--pdd-back-1': back[0], '--pdd-back-2': back[1] } as Record<string, string>) : undefined;

/**
 * The decks as a row of small card packs along the bottom, scrolled sideways.
 * Each pack shows its deck's card back; the chosen one lifts and is kept centred.
 */
export default function DeckTray({ choices, selected, busy, onSelect }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Keep the chosen pack in view (centred) when it changes, including on load.
  useEffect(() => {
    const track = trackRef.current;
    const pack = track?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!track || !pack) return;
    // Measured against the track itself (offsetLeft would be relative to some other ancestor).
    const t = track.getBoundingClientRect();
    const p = pack.getBoundingClientRect();
    const left = track.scrollLeft + (p.left - t.left) - (t.width - p.width) / 2;
    track.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [selected]);

  return (
    <div class="pdd__tray" role="group" aria-label="Barajas">
      <div class="pdd__tray-track" ref={trackRef}>
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            class="pdd__pack"
            aria-pressed={c.id === selected}
            aria-disabled={busy || undefined}
            style={backStyle(c.back)}
            onClick={() => !busy && c.id !== selected && onSelect(c.id)}
          >
            <span class="pdd__pack-cards" aria-hidden="true">
              <span class="pdd__pack-card" />
              <span class="pdd__pack-card" />
              <span class="pdd__pack-card pdd__pack-card--top">
                <span class="pdd__pack-emblem">¿?</span>
              </span>
            </span>
            <span class="pdd__pack-name">{c.name}</span>
            <span class="pdd__pack-count">
              <span class="pdd__sr-only">, quedan </span>
              {c.left}
              <span class="pdd__sr-only"> cartas</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
