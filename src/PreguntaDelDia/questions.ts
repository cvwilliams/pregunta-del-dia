// The questions live in ./questions/, one JSON file per deck (see decks.ts), one card
// per line. Run `npm test` after editing: it checks ids, fields, duplicates and decks.
import diaADia from './questions/dia-a-dia.json';
import comida from './questions/comida.json';
import sobreTi from './questions/sobre-ti.json';
import relaciones from './questions/relaciones.json';
import trabajo from './questions/trabajo.json';
import tiempoLibre from './questions/tiempo-libre.json';
import cultura from './questions/cultura.json';
import opiniones from './questions/opiniones.json';
import imagina from './questions/imagina.json';

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface Question {
  /** Stable id (q0001…), saved in the viewer's browser. Never change or reuse one; give new cards the next number. */
  id: string;
  /** The question in Spanish. */
  es: string;
  /** English translation. */
  en: string;
  level: Level;
  category: string;
  /** Helpful words for answering: [spanish, english]. */
  vocab?: [string, string][];
  /** A sample opening for an answer. */
  starter?: string;
}

export const questions = [
  ...diaADia,
  ...comida,
  ...sobreTi,
  ...relaciones,
  ...trabajo,
  ...tiempoLibre,
  ...cultura,
  ...opiniones,
  ...imagina,
] as Question[];
