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
}

/** The face of a card: chips, the question, its buttons and the optional help. */
export default function CardFace({ q, showHelp, onToggleHelp, questionRef, children }: Props) {
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  return (
    <>
      <div class="pdd__meta">
        <span class="pdd__chip">{q.category}</span>
        <span class="pdd__chip pdd__chip--level">{q.level}</span>
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
    </>
  );
}
