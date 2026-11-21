import type { ComponentChildren, Ref } from 'preact';
import type { Question } from './questions';

export function speak(text: string) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES';
  const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('es'));
  if (voice) u.voice = voice;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

interface Props {
  q: Question;
  showHelp: boolean;
  onToggleHelp: () => void;
  /** Given on the table card, which takes focus when it turns face up. */
  questionRef?: Ref<HTMLParagraphElement>;
  /** Extra buttons after Escuchar and Ayuda. */
  children?: ComponentChildren;
  /** Marked to come back to (★). The star shows when onToggleSaved is given. */
  saved?: boolean;
  onToggleSaved?: () => void;
}

/** A star, outlined or filled; decorative (its button carries the name). */
export function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      class="pdd__star-icon"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
    </svg>
  );
}

/** The face of a card: chips, the question, its buttons and the optional help. */
export default function CardFace({ q, showHelp, onToggleHelp, questionRef, children, saved = false, onToggleSaved }: Props) {
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  return (
    <div class="pdd__paper-body">
      <div class="pdd__meta">
        <span class="pdd__chip">{q.category}</span>
        <span class="pdd__meta-end">
          <span class="pdd__chip pdd__chip--level">{q.level}</span>
          {onToggleSaved && (
            <button
              type="button"
              class="pdd__star"
              aria-pressed={saved}
              aria-label="Guardar"
              title={saved ? 'Quitar de guardadas' : 'Guardar'}
              onClick={onToggleSaved}
            >
              <StarIcon filled={saved} />
            </button>
          )}
        </span>
      </div>
      <p class="pdd__question" lang="es" ref={questionRef} tabIndex={questionRef ? -1 : undefined}>
        {q.es}
      </p>
      <div class="pdd__actions">
        {canSpeak && (
          <button type="button" class="pdd__btn" onClick={() => speak(q.es)}>
            <span aria-hidden="true">🔊</span> Escuchar
          </button>
        )}
        <button type="button" class="pdd__btn" aria-expanded={showHelp} onClick={onToggleHelp}>
          Ayuda
        </button>
        {children}
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
              <span aria-hidden="true">✍️ </span>
              {q.starter}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
