# Writing questions

The goal is about 3,000 cards: roughly 333 in each of the 9 decks, at each level in this mix:

| A1 | A2 | B1 | B2 | C1 |
|----|----|----|----|----|
| 15% (50) | 25% (83) | 25% (83) | 20% (67) | 15% (50) |

`npm run stats` (or `make stats`) shows where each deck stands against those targets, and the next id for each deck.

## Workflow

1. Write a batch as a Python file (anywhere outside the repo is fine):

   ```python
   CARDS = [
       ('B1', 'Música', '¿Qué canción te trae buenos recuerdos?', 'What song brings back good memories?',
        [('traer recuerdos', 'to bring back memories'), ('me recuerda a', 'it reminds me of'), ('aquel verano', 'that summer')],
        'Esta canción me recuerda a…'),
   ]
   ```

2. Add it: `python3 scripts/add_questions.py <deck-id> batch.py`. Ids come from the deck's own range in `scripts/question-ranges.json`, so decks can be written in parallel without clashing.
3. Run `npm test` (or `make test`). It checks fields, punctuation, duplicates, categories and id ranges.

Batches of 50–100 work well. Keep each deck's level mix on target as you go rather than all at the end.

## The standard

**Every card** has the Spanish question, an English translation, a level, a category from its deck (see `src/PreguntaDelDia/decks.ts`), 3 vocabulary pairs (2–4 allowed) and a sentence starter ending in "…".

**Good questions** are ones a learner can actually talk about: personal, concrete, open-ended. They should invite a few sentences, not a yes or no. Avoid trivia, anything that needs specialist knowledge, and sensitive personal topics (health conditions, religion, money worries, trauma). Each card should be clearly different from the others in its deck, not a rewording.

**Neutral Spanish.** Use vocabulary understood everywhere, and *ustedes* (never *vosotros*). Where everyday words differ by region, the vocab gives both: "el celular / el móvil", "la computadora / el ordenador", "la piscina / la alberca", "manejar / conducir", "el boleto / la entrada". Avoid words that are rude in some countries (for example *coger*). Use "niño/a" style for gendered words that refer to the reader.

**Grammar grows with the level:**

- **A1:** present tense, everyday vocabulary, very short questions. *¿Qué música te gusta?*
- **A2:** past tenses (preterite and imperfect), *ir a*, comparisons, likes and habits. *¿Qué hacías los veranos cuando eras niño/a?*
- **B1:** opinions with reasons, experiences, the conditional, and simple subjunctive (*prefiero que…*, *si tuviera…*). *¿Qué harías si no tuvieras celular durante una semana?*
- **B2:** the subjunctive in full, hypotheticals, weighing two sides, more abstract topics. *¿Es necesario que un pasatiempo sea productivo?*
- **C1:** abstract and societal questions, nuanced vocabulary, complex structures. *¿Hasta qué punto el ocio se ha convertido en otra forma de consumo?*

**Punctuation.** Questions are `¿…?` in Spanish and end in `?` in English. The `¿` can open mid-sentence: "Si pudieras…, ¿cuál elegirías?". Prompts such as "Cuéntame…" end in a full stop in both languages.

**Vocab** gives words the learner is likely to need for *their answer*, not words already in the question. Spanish first, with the article for nouns ("la temporada"). English glosses are short.

**Starters** are the natural first words of an answer, matching the question's tense: "El fin de semana pasado…", "Si pudiera…, …".
