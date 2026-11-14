import type { Question } from './questions';

/** A themed deck: every question whose category is listed. */
export interface Deck {
  /** Stable id, saved in the viewer's browser as their selected deck. */
  id: string;
  name: string;
  categories: string[];
  /**
   * Card-back colours for this deck: [lighter, darker] ends of the gradient behind
   * the shared pattern. The cream prompt text sits on the lighter one, so it needs
   * at least 4.5:1 contrast with #f6eedb (tests/content.test.ts checks this).
   * Leave it out to use the theme's --pdd-back-1 / --pdd-back-2.
   */
  back?: [string, string];
}

/** The combined deck: every card from every deck. It uses the theme's green card back. */
export const ALL_DECK_ID = 'todas';
export const ALL_DECK_NAME = 'Todas';

export const decks: Deck[] = [
  {
    id: 'dia-a-dia',
    name: 'Día a día',
    categories: ['Vida diaria', 'Rutina', 'Comida', 'Hogar', 'Tiempo', 'Tiempo libre', 'Trabajo'],
    back: ['#a24a33', '#6a2c1d'], // terracotta
  },
  {
    id: 'sobre-ti',
    name: 'Sobre ti',
    categories: ['Familia', 'Personalidad', 'Recuerdos', 'Reflexión', 'Planes'],
    back: ['#7a4486', '#4a2754'], // plum
  },
  { id: 'opiniones', name: 'Opiniones y debate', categories: ['Opiniones', 'Debate'], back: ['#7f5d18', '#523b0e'] }, // ochre
  { id: 'imagina', name: 'Imagina', categories: ['Hipótesis'], back: ['#4650a0', '#272d68'] }, // indigo
  { id: 'cultura', name: 'Cultura y viajes', categories: ['Cultura', 'Viajes', 'Idiomas'], back: ['#1c6e7d', '#0f444f'] }, // teal
];

/** Ids of the cards in a deck. `ALL_DECK_ID` means every card. */
export function cardsInDeck(deckId: string, allDecks: Deck[], questions: Question[]): Set<string> {
  if (deckId === ALL_DECK_ID) return new Set(questions.map((q) => q.id));
  const deck = allDecks.find((d) => d.id === deckId);
  const categories = new Set(deck?.categories ?? []);
  return new Set(questions.filter((q) => categories.has(q.category)).map((q) => q.id));
}
