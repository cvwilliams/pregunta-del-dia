export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface Question {
  /** Stable id, saved in the viewer's browser. Never change or reuse one; give new cards the next number. */
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

export const questions: Question[] = [
  { id: 'q0001', es: '¿Qué desayunaste hoy?', en: 'What did you have for breakfast today?', level: 'A1', category: 'Comida',
    vocab: [['el pan tostado', 'toast'], ['los huevos', 'eggs'], ['nada', 'nothing']], starter: 'Hoy desayuné…' },
  { id: 'q0002', es: '¿Cuál es tu estación del año favorita y por qué?', en: 'What is your favorite season and why?', level: 'A1', category: 'Opiniones',
    vocab: [['la primavera', 'spring'], ['el otoño', 'autumn'], ['hace calor', "it's hot"]], starter: 'Mi estación favorita es…' },
  { id: 'q0003', es: '¿Tienes mascotas? ¿Cómo se llaman?', en: 'Do you have pets? What are their names?', level: 'A1', category: 'Vida diaria',
    vocab: [['el perro', 'dog'], ['el gato', 'cat'], ['se llama', 'its name is']], starter: 'Tengo un… que se llama…' },
  { id: 'q0004', es: '¿Cómo es tu casa?', en: 'What is your house like?', level: 'A1', category: 'Hogar',
    vocab: [['grande / pequeña', 'big / small'], ['la cocina', 'kitchen'], ['el jardín', 'garden']], starter: 'Mi casa es…' },
  { id: 'q0005', es: '¿A qué hora te levantas normalmente?', en: 'What time do you normally get up?', level: 'A1', category: 'Rutina',
    vocab: [['levantarse', 'to get up'], ['temprano', 'early'], ['tarde', 'late']], starter: 'Normalmente me levanto a las…' },
  { id: 'q0006', es: '¿De qué color es tu ropa hoy?', en: 'What color are your clothes today?', level: 'A1', category: 'Vida diaria',
    vocab: [['la camisa', 'shirt'], ['los pantalones', 'trousers'], ['llevo', "I'm wearing"]], starter: 'Hoy llevo…' },
  { id: 'q0007', es: '¿Cuántas personas hay en tu familia?', en: 'How many people are there in your family?', level: 'A1', category: 'Familia',
    vocab: [['los hermanos', 'siblings'], ['los padres', 'parents'], ['hijo único / hija única', 'only child']], starter: 'En mi familia somos…' },
  { id: 'q0008', es: '¿Qué te gusta hacer los fines de semana?', en: 'What do you like to do on weekends?', level: 'A1', category: 'Tiempo libre',
    vocab: [['descansar', 'to rest'], ['salir con amigos', 'to go out with friends'], ['dormir', 'to sleep']], starter: 'Los fines de semana me gusta…' },
  { id: 'q0009', es: '¿Qué tiempo hace hoy donde estás?', en: "What's the weather like today where you are?", level: 'A1', category: 'Tiempo',
    vocab: [['está nublado', "it's cloudy"], ['llueve', "it's raining"], ['hace sol', "it's sunny"]], starter: 'Hoy hace…' },
  { id: 'q0010', es: '¿Cuál es tu comida favorita?', en: 'What is your favorite food?', level: 'A1', category: 'Comida',
    vocab: [['me encanta', 'I love'], ['picante', 'spicy'], ['dulce', 'sweet']], starter: 'Mi comida favorita es…' },

  { id: 'q0011', es: '¿Qué hiciste ayer por la tarde?', en: 'What did you do yesterday afternoon?', level: 'A2', category: 'Rutina',
    vocab: [['fui', 'I went'], ['trabajé', 'I worked'], ['vi una serie', 'I watched a show']], starter: 'Ayer por la tarde…' },
  { id: 'q0012', es: '¿Cómo era tu mejor amigo de la infancia?', en: 'What was your best childhood friend like?', level: 'A2', category: 'Recuerdos',
    vocab: [['era', 'he/she was'], ['divertido/a', 'fun'], ['jugábamos', 'we used to play']], starter: 'Mi mejor amigo era…' },
  { id: 'q0013', es: '¿Adónde fuiste en tus últimas vacaciones?', en: 'Where did you go on your last vacation?', level: 'A2', category: 'Viajes',
    vocab: [['la playa', 'beach'], ['la montaña', 'mountains'], ['me quedé en casa', 'I stayed home']], starter: 'En mis últimas vacaciones fui a…' },
  { id: 'q0014', es: '¿Qué vas a hacer este fin de semana?', en: 'What are you going to do this weekend?', level: 'A2', category: 'Planes',
    vocab: [['voy a', "I'm going to"], ['visitar', 'to visit'], ['todavía no sé', "I don't know yet"]], starter: 'Este fin de semana voy a…' },
  { id: 'q0015', es: '¿Prefieres el campo o la ciudad?', en: 'Do you prefer the countryside or the city?', level: 'A2', category: 'Opiniones',
    vocab: [['tranquilo', 'quiet'], ['el ruido', 'noise'], ['hay más…', 'there is more…']], starter: 'Prefiero… porque…' },
  { id: 'q0016', es: '¿Qué hacías después del colegio cuando eras niño/a?', en: 'What did you do after school when you were a kid?', level: 'A2', category: 'Recuerdos',
    vocab: [['los deberes', 'homework'], ['montar en bici', 'to ride a bike'], ['solía', 'I used to']], starter: 'Cuando era niño/a, después del colegio…' },
  { id: 'q0017', es: '¿Cuál es la última película que viste?', en: 'What is the last movie you saw?', level: 'A2', category: 'Cultura',
    vocab: [['me gustó', 'I liked it'], ['aburrida', 'boring'], ['la recomiendo', 'I recommend it']], starter: 'La última película que vi fue…' },
  { id: 'q0018', es: '¿Sabes cocinar? ¿Cuál es tu especialidad?', en: 'Can you cook? What is your specialty?', level: 'A2', category: 'Comida',
    vocab: [['la receta', 'recipe'], ['al horno', 'baked'], ['me sale bien', 'I make it well']], starter: 'Sí, sé cocinar… Mi especialidad es…' },
  { id: 'q0019', es: '¿Qué llevas siempre en tu mochila o bolso?', en: 'What do you always carry in your backpack or bag?', level: 'A2', category: 'Vida diaria',
    vocab: [['las llaves', 'keys'], ['la cartera', 'wallet'], ['el cargador', 'charger']], starter: 'Siempre llevo…' },
  { id: 'q0020', es: '¿Cómo llegas al trabajo o a clase?', en: 'How do you get to work or class?', level: 'A2', category: 'Rutina',
    vocab: [['a pie', 'on foot'], ['en metro', 'by subway'], ['tardo', 'it takes me']], starter: 'Voy… y tardo…' },

  { id: 'q0021', es: '¿Qué harías si te tocara la lotería?', en: 'What would you do if you won the lottery?', level: 'B1', category: 'Hipótesis',
    vocab: [['compraría', 'I would buy'], ['viajaría', 'I would travel'], ['ahorrar', 'to save']], starter: 'Si me tocara la lotería, …' },
  { id: 'q0022', es: '¿Qué consejo le darías a tu yo de hace diez años?', en: 'What advice would you give your self from ten years ago?', level: 'B1', category: 'Reflexión',
    vocab: [['no te preocupes', "don't worry"], ['aprovecha', 'make the most of'], ['arriesgarse', 'to take risks']], starter: 'Le diría que…' },
  { id: 'q0023', es: '¿Cuál ha sido el mejor día de este año hasta ahora?', en: 'What has been the best day of this year so far?', level: 'B1', category: 'Reflexión',
    vocab: [['ha sido', 'has been'], ['inolvidable', 'unforgettable'], ['celebrar', 'to celebrate']], starter: 'El mejor día ha sido…' },
  { id: 'q0024', es: '¿Qué costumbre de otro país te gustaría adoptar?', en: 'What custom from another country would you like to adopt?', level: 'B1', category: 'Cultura',
    vocab: [['la siesta', 'nap'], ['la sobremesa', 'lingering at the table after a meal'], ['me gustaría', 'I would like']], starter: 'Me gustaría adoptar…' },
  { id: 'q0025', es: '¿Has aprendido algo nuevo esta semana?', en: 'Have you learned something new this week?', level: 'B1', category: 'Reflexión',
    vocab: [['he aprendido', 'I have learned'], ['me di cuenta de', 'I realized'], ['curioso', 'interesting / odd']], starter: 'Esta semana he aprendido que…' },
  { id: 'q0026', es: '¿Qué es lo que más te cuesta del español?', en: 'What do you find hardest about Spanish?', level: 'B1', category: 'Idiomas',
    vocab: [['me cuesta', 'I find it hard'], ['el subjuntivo', 'the subjunctive'], ['la pronunciación', 'pronunciation']], starter: 'Lo que más me cuesta es…' },
  { id: 'q0027', es: 'Si pudieras vivir en cualquier ciudad, ¿cuál elegirías?', en: 'If you could live in any city, which would you choose?', level: 'B1', category: 'Hipótesis',
    vocab: [['elegiría', 'I would choose'], ['el ambiente', 'atmosphere'], ['el clima', 'climate']], starter: 'Si pudiera, viviría en…' },
  { id: 'q0028', es: '¿Qué libro o serie le recomendarías a un amigo?', en: 'What book or show would you recommend to a friend?', level: 'B1', category: 'Cultura',
    vocab: [['engancharse', 'to get hooked'], ['la trama', 'plot'], ['el personaje', 'character']], starter: 'Le recomendaría… porque…' },
  { id: 'q0029', es: '¿Cuál fue tu primer trabajo y qué aprendiste de él?', en: 'What was your first job and what did you learn from it?', level: 'B1', category: 'Trabajo',
    vocab: [['el sueldo', 'pay'], ['el jefe / la jefa', 'boss'], ['aprendí a', 'I learned to']], starter: 'Mi primer trabajo fue…' },
  { id: 'q0030', es: '¿Eres una persona madrugadora o noctámbula?', en: 'Are you a morning person or a night owl?', level: 'B1', category: 'Personalidad',
    vocab: [['madrugar', 'to get up early'], ['trasnochar', 'to stay up late'], ['rendir', 'to be productive']], starter: 'Soy más bien…' },
  { id: 'q0031', es: '¿Qué tradición familiar te gusta más?', en: 'Which family tradition do you like most?', level: 'B1', category: 'Familia',
    vocab: [['reunirse', 'to get together'], ['cada año', 'every year'], ['las fiestas', 'holidays']], starter: 'En mi familia siempre…' },
  { id: 'q0032', es: '¿Qué te hace reír siempre?', en: 'What always makes you laugh?', level: 'B1', category: 'Personalidad',
    vocab: [['me hace gracia', 'I find it funny'], ['el chiste', 'joke'], ['partirse de risa', 'to crack up']], starter: 'Siempre me hace reír…' },

  { id: 'q0033', es: '¿Crees que la tecnología nos une o nos separa?', en: 'Do you think technology brings us together or drives us apart?', level: 'B2', category: 'Debate',
    vocab: [['por un lado… por otro…', 'on one hand… on the other…'], ['las redes sociales', 'social media'], ['aislarse', 'to isolate oneself']], starter: 'Por un lado, creo que…' },
  { id: 'q0034', es: '¿Qué habrías estudiado si no hubieras elegido tu carrera?', en: 'What would you have studied if you had not chosen your field?', level: 'B2', category: 'Hipótesis',
    vocab: [['habría estudiado', 'I would have studied'], ['la vocación', 'calling'], ['arrepentirse', 'to regret']], starter: 'Si no hubiera estudiado…, habría…' },
  { id: 'q0035', es: '¿Es mejor trabajar desde casa o en una oficina?', en: 'Is it better to work from home or in an office?', level: 'B2', category: 'Debate',
    vocab: [['el teletrabajo', 'remote work'], ['la conciliación', 'work-life balance'], ['echar de menos', 'to miss']], starter: 'Desde mi punto de vista…' },
  { id: 'q0036', es: '¿Qué te gustaría que se inventara en los próximos años?', en: 'What would you like to be invented in the coming years?', level: 'B2', category: 'Hipótesis',
    vocab: [['ojalá', 'I hope'], ['que se inventara', 'that someone invented'], ['ahorrar tiempo', 'to save time']], starter: 'Me gustaría que se inventara…' },
  { id: 'q0037', es: 'Cuéntame un momento en que tuviste que salir de tu zona de confort.', en: 'Tell me about a time you had to step out of your comfort zone.', level: 'B2', category: 'Recuerdos',
    vocab: [['atreverse', 'to dare'], ['al principio', 'at first'], ['al final resultó', 'in the end it turned out']], starter: 'Una vez tuve que…' },
  { id: 'q0038', es: '¿Qué opinas del turismo masivo?', en: 'What do you think about mass tourism?', level: 'B2', category: 'Debate',
    vocab: [['el impacto', 'impact'], ['los vecinos', 'local residents'], ['sostenible', 'sustainable']], starter: 'Opino que…' },
  { id: 'q0039', es: '¿Qué cualidad valoras más en un amigo?', en: 'What quality do you value most in a friend?', level: 'B2', category: 'Personalidad',
    vocab: [['la lealtad', 'loyalty'], ['la sinceridad', 'honesty'], ['que sea', 'that they be']], starter: 'Lo que más valoro es que sea…' },
  { id: 'q0040', es: '¿Qué palabra en español te parece la más bonita?', en: 'Which Spanish word do you find the most beautiful?', level: 'B2', category: 'Idiomas',
    vocab: [['sonar', 'to sound'], ['el significado', 'meaning'], ['madrugada', 'the early hours of the morning']], starter: 'Me encanta la palabra… porque…' },

  { id: 'q0041', es: '¿Hasta qué punto crees que el lugar donde naciste ha definido quién eres?', en: 'To what extent do you think where you were born has shaped who you are?', level: 'C1', category: 'Reflexión',
    vocab: [['hasta cierto punto', 'to some extent'], ['el entorno', 'environment / surroundings'], ['marcar', 'to leave a mark']], starter: 'Hasta cierto punto, …' },
  { id: 'q0042', es: '¿Qué cambiarías del sistema educativo si estuviera en tus manos?', en: 'What would you change about the education system if it were up to you?', level: 'C1', category: 'Debate',
    vocab: [['si estuviera en mis manos', 'if it were up to me'], ['fomentar', 'to encourage'], ['memorizar', 'to memorize']], starter: 'Si estuviera en mis manos, …' },
  { id: 'q0043', es: '¿Qué refrán español describe mejor tu manera de ser?', en: 'Which Spanish saying best describes the way you are?', level: 'C1', category: 'Idiomas',
    vocab: [['más vale tarde que nunca', 'better late than never'], ['a quien madruga, Dios le ayuda', 'the early bird catches the worm'], ['poco a poco se va lejos', 'slow and steady goes far']], starter: 'Creo que me describe…' },
];
