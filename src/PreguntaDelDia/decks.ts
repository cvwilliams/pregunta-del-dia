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
    categories: ['Vida diaria', 'Rutina', 'Hogar', 'Tiempo', 'Compras', 'Salud'],
    back: ['#a24a33', '#6a2c1d'], // terracotta
  },
  { id: 'comida', name: 'Comida', categories: ['Comida', 'Cocina', 'Restaurantes'], back: ['#626c1c', '#3f4610'] }, // olive
  {
    id: 'sobre-ti',
    name: 'Sobre ti',
    categories: ['Personalidad', 'Recuerdos', 'Reflexión', 'Planes', 'Sueños'],
    back: ['#7a4486', '#4a2754'], // plum
  },
  {
    id: 'relaciones',
    name: 'Relaciones',
    categories: ['Familia', 'Amistad', 'Amor', 'Convivencia'],
    back: ['#9b3557', '#631f36'], // raspberry
  },
  {
    id: 'trabajo',
    name: 'Trabajo y estudios',
    categories: ['Trabajo', 'Estudios', 'Idiomas', 'Dinero'],
    back: ['#4f565e', '#31363c'], // charcoal
  },
  {
    id: 'tiempo-libre',
    name: 'Tiempo libre',
    categories: ['Tiempo libre', 'Deportes', 'Música', 'Cine y series', 'Libros', 'Tecnología'],
    back: ['#2a659a', '#173f63'], // blue
  },
  {
    id: 'cultura',
    name: 'Cultura y viajes',
    categories: ['Cultura', 'Viajes', 'Tradiciones', 'Lugares'],
    back: ['#1c6e7d', '#0f444f'], // teal
  },
  {
    id: 'opiniones',
    name: 'Opiniones y debate',
    categories: ['Opiniones', 'Debate', 'Sociedad', 'Medio ambiente'],
    back: ['#7f5d18', '#523b0e'], // ochre
  },
  { id: 'imagina', name: 'Imagina', categories: ['Hipótesis', 'Dilemas'], back: ['#4650a0', '#272d68'] }, // indigo
];

/** Ids of the cards in a deck. `ALL_DECK_ID` means every card. */
export function cardsInDeck(deckId: string, allDecks: Deck[], questions: Question[]): Set<string> {
  if (deckId === ALL_DECK_ID) return new Set(questions.map((q) => q.id));
  const deck = allDecks.find((d) => d.id === deckId);
  const categories = new Set(deck?.categories ?? []);
  return new Set(questions.filter((q) => categories.has(q.category)).map((q) => q.id));
}
