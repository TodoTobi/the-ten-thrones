// src/config/realms.config.ts

import { RealmConfig } from '../core/types';



export const REALMS_CONFIG: RealmConfig[] = [

  {

    id: 'eternal_crown',

    order: 1,

    name: 'Reino I — La Corona Eterna',

    civilization: 'Realeza Humana',

    rivalName: 'Rey Aldric IV',

    rivalTitle: 'El Monarca de Hierro y Oro',

    recommendedDifficulty: 'beginner',

    playStyle: {

      aggressionWeight: 1.0,

      defenseWeight: 1.2,

      description: 'Juego clásico, control del centro y estructura sólida. Castiga la impaciencia.'

    },

    palette: {

      primary: 0xc59b27,

      secondary: 0x7a1218,

      accent: 0x1a1615,

      ambientLight: 0xffe0b2,

      directionalLight: 0xffb74d,

      fogColor: 0x120d0a,

      fogDensity: 0.015

    },

    boardMaterials: {

      lightSquareColor: 0xe6d2b5,

      darkSquareColor: 0x3d2314,

      borderColor: 0x99732c,

      roughness: 0.35,

      metalness: 0.25

    },

    handAppearance: { skinColor: 0xd8b094, armorColor: 0xc59b27, ringColor: 0x990000, scale: 1.0 },

    musicTrack: '/assets/audio/music/realms/01_eternal_crown.mp3',

    ambientElements: ['candles', 'dust'],

    baseEmotions: { confidence: 75, frustration: 10, surprise: 0, respect: 30, aggressiveness: 40, patience: 85, tauntIntensity: 45 },

    dialogues: {

      GAME_START: [

        { text: 'He gobernado cincuenta inviernos. Veamos cuánto dura tu ambición.', soundCue: '[El rey se acaricia la barba] «Hmm...»', state: 'Confident' },

        { text: 'El tablero no perdona la juventud imprudente. Adelante.', soundCue: '[Golpea los dedos contra el trono] «Adelante.»', state: 'Idle' }

      ],

      NORMAL_MOVE: [

        { text: 'Predecible, pero aceptable.', soundCue: '[El rey piensa...] «Mmm...»', state: 'Thinking' }

      ],

      CAPTURE: [

        { text: 'Un peón menos en tu guardia. La corona siempre cobra su tributo.', soundCue: '[Sonrisa severa] «Tsk, tsk.»', state: 'Capture' }

      ],

      PIECE_LOST: [

        { text: 'Un sacrificio calculado... no te ilusiones.', soundCue: '[Frunce el ceño] «Hmph.»', state: 'PieceLost' }

      ],

      QUEEN_CAPTURE: [

        { text: '¡Has caído en la trampa real! Tu Dama pertenece a las mazmorras.', soundCue: '[Risa grave] «¡Ja!»', state: 'Laugh' }

      ],

      CHECK_GIVEN: [

        { text: 'Arrodíllate. Tu rey está descubierto.', soundCue: '[Voz autoritaria] «Jaque.»', state: 'Confident' }

      ],

      CHECK_RECEIVED: [

        { text: '¿Osas amenazar la Corona en su propio salón?', soundCue: '[Murmullo tenso] «Insolente...»', state: 'Check' }

      ],

      CASTLING: [

        { text: 'Las murallas se cierran. Sabia precaución.', soundCue: '[Asiente lentamente] «Mmm.»', state: 'Thinking' }

      ],

      PROMOTION: [

        { text: 'Incluso el vasallo más humilde puede alcanzar la nobleza si sobrevive.', soundCue: '«Notable.»', state: 'Respect' }

      ],

      TACTICAL_BLUNDER: [

        { text: '¿Eso fue una estrategia o simplemente cerraste los ojos al mover?', soundCue: '[Sonrisa irónica] «Oh, juventud...»', state: 'Taunt' }

      ],

      BRILLIANT_MOVE: [

        { text: 'Interesante... Hacía décadas que ningún retador veía esa línea.', soundCue: '[Se inclina hacia adelante] «¡Ah!»', state: 'BrilliantMove' }

      ],

      RECOGNIZABLE_OPENING: [

        { text: 'Conozco esos tratados antiguos. Yo mismo mandé escribir la mitad.', soundCue: '«Clásico.»', state: 'Curious' }

      ],

      REPETITION: [

        { text: 'Dar vueltas en círculos no te salvará del veredicto.', soundCue: '«Basta de rodeos.»', state: 'Annoyed' }

      ],

      WINNING_POSITION: [

        { text: 'Tu línea defensiva se desmorona como un reino sin heredero.', soundCue: '«Es cuestión de tiempo.»', state: 'Confident' }

      ],

      DESPERATE_POSITION: [

        { text: 'Aún conservo la guardia real. Esto no ha terminado.', soundCue: '[Aprieta el reposabrazos] «Grr...»', state: 'DeepThinking' }

      ],

      DRAW: [

        { text: 'Un tratado de paz honorable. Ninguno cede el trono hoy.', soundCue: '«Tablas.»', state: 'Respect' }

      ],

      VICTORY: [

        { text: 'La experiencia vuelve a imponerse sobre el ímpetu.', soundCue: '[Se levanta con solemnidad] «Victoria real.»', state: 'Victory' }

      ],

      DEFEAT: [

        { text: 'Has derribado a un viejo monarca con honor. El próximo trono no será tan clemente.', soundCue: '[Inclina la cabeza] «Bien jugado.»', state: 'Defeat' }

      ],

      RESIGNATION: [

        { text: 'Retirarse a tiempo también es una virtud de los generales.', soundCue: '«Se acepta tu rendición.»', state: 'Confident' }

      ]

    },

    challenges: [

      {

        id: 'ec_1',

        title: 'El Gambito de la Guardia Real',

        description: 'Gana material o da jaque mate en 3 jugadas contra la defensa del Rey.',

        initialFen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',

        objective: 'win_material',

        moveLimit: 10

      }

    ]

  },

  {

    id: 'elven_throne',

    order: 2,

    name: 'Reino II — El Trono de los Elfos',

    civilization: 'Elfos Ancestrales',

    rivalName: 'Reina Lyraeth',

    rivalTitle: 'Tejedora de los Cristales Lunares',

    recommendedDifficulty: 'easy',

    playStyle: {

      aggressionWeight: 0.9,

      defenseWeight: 1.3,

      description: 'Maniobras a largo plazo, dominio de diagonales con alfiles y trampas sutiles.'

    },

    palette: {

      primary: 0x0f4c3a,

      secondary: 0xc0c8d8,

      accent: 0x7b2cbf,

      ambientLight: 0x80ffdb,

      directionalLight: 0xc77dff,

      fogColor: 0x071a15,

      fogDensity: 0.018

    },

    boardMaterials: {

      lightSquareColor: 0xd8f3dc,

      darkSquareColor: 0x1b4332,

      borderColor: 0x95d5b2,

      roughness: 0.2,

      metalness: 0.4

    },

    handAppearance: { skinColor: 0xe8dff5, armorColor: 0xb8c0ff, ringColor: 0x48bfe3, scale: 0.92 },

    musicTrack: '/assets/audio/music/realms/02_elven_throne.mp3',

    ambientElements: ['magic_runes', 'leaves'],

    baseEmotions: { confidence: 80, frustration: 5, surprise: 5, respect: 40, aggressiveness: 35, patience: 95, tauntIntensity: 55 },

    dialogues: {

      GAME_START: [{ text: 'Vi tu llegada en el reflejo del estanque antes de que nacieras.', soundCue: '[La reina élfica analiza] «Comencemos.»', state: 'Confident' }],

      NORMAL_MOVE: [{ text: 'El bosque escucha tus pasos.', soundCue: '«Mmm...»', state: 'Thinking' }],

      CAPTURE: [{ text: 'Una hoja cae cuando llega su estación.', soundCue: '[Sonrisa serena] «Suave.»', state: 'Capture' }],

      PIECE_LOST: [{ text: 'El viento cambia, pero las raíces permanecen.', soundCue: '«Ah...»', state: 'PieceLost' }],

      QUEEN_CAPTURE: [{ text: 'Tu pieza más ruidosa ha quedado en silencio.', soundCue: '[Risa cristalina] «Ja, ja...»', state: 'Laugh' }],

      CHECK_GIVEN: [{ text: 'No hay escondite bajo la luz de la luna. Jaque.', soundCue: '«Jaque.»', state: 'Confident' }],

      CHECK_RECEIVED: [{ text: 'Una espina inesperada.', soundCue: '[Levanta una ceja] «Oh...»', state: 'Check' }],

      CASTLING: [{ text: 'Buscas refugio tras la corteza.', soundCue: '«Prudente.»', state: 'Thinking' }],

      PROMOTION: [{ text: 'Una semilla florece en el extremo del santuario.', soundCue: '«Fascinante.»', state: 'Surprised' }],

      TACTICAL_BLUNDER: [{ text: 'La paciencia suele ser más peligrosa que la fuerza... y hoy te faltaron ambas.', soundCue: '[Sonrisa de superioridad] «Qué impaciente.»', state: 'Taunt' }],

      BRILLIANT_MOVE: [{ text: 'Ni siquiera los oráculos anticiparon ese sendero.', soundCue: '«Extraordinario.»', state: 'BrilliantMove' }],

      RECOGNIZABLE_OPENING: [{ text: 'Una danza antigua. Veamos si conoces el último compás.', soundCue: '«Elegante.»', state: 'Curious' }],

      REPETITION: [{ text: 'El tiempo no significa nada para mí, pero tú envejeces en cada repetición.', soundCue: '«¿Otra vez?»', state: 'Taunt' }],

      WINNING_POSITION: [{ text: 'Las raíces ya rodean tu trono.', soundCue: '«Inevitables.»', state: 'Confident' }],

      DESPERATE_POSITION: [{ text: 'La noche se oscurece... debo concentrarme.', soundCue: '[Cierra los ojos] «...»', state: 'DeepThinking' }],

      DRAW: [{ text: 'El equilibrio natural se conserva.', soundCue: '«Paz.»', state: 'Respect' }],

      VICTORY: [{ text: 'Perdiste esta partida hace diez turnos, solo acabas de darte cuenta.', soundCue: '«Descansa.»', state: 'Victory' }],

      DEFEAT: [{ text: 'Tu mente brilla con una luz rara entre los mortales.', soundCue: '[Reverencia sutil] «Tienes mi bendición.»', state: 'Defeat' }],

      RESIGNATION: [{ text: 'Aceptar el destino ahorra sufrimiento innecesario.', soundCue: '«Sabio.»', state: 'Idle' }]

    },

    challenges: []

  },

  {

    id: 'iron_bastion',

    order: 3,

    name: 'Reino III — El Bastión de Hierro',

    civilization: 'Clanes Enanos',

    rivalName: 'Thorgar Rompeyunques',

    rivalTitle: 'Señor de la Gran Forja Subterránea',

    recommendedDifficulty: 'easy',

    playStyle: {

      aggressionWeight: 1.1,

      defenseWeight: 1.5,

      description: 'Cadenas de peones impenetrables, torres pesadas y contragolpes contundentes.'

    },

    palette: {

      primary: 0xb87333,

      secondary: 0x2b2d2f,

      accent: 0xff5400,

      ambientLight: 0xff9e00,

      directionalLight: 0xff6d00,

      fogColor: 0x140d08,

      fogDensity: 0.02

    },

    boardMaterials: {

      lightSquareColor: 0xc2b280,

      darkSquareColor: 0x2c2c2c,

      borderColor: 0xb87333,

      roughness: 0.5,

      metalness: 0.7

    },

    handAppearance: { skinColor: 0xc68b59, armorColor: 0x7f5539, ringColor: 0xff6d00, scale: 1.15 },

    musicTrack: '/assets/audio/music/realms/03_iron_bastion.mp3',

    ambientElements: ['embers', 'dust'],

    baseEmotions: { confidence: 85, frustration: 20, surprise: 10, respect: 50, aggressiveness: 65, patience: 80, tauntIntensity: 60 },

    dialogues: {

      GAME_START: [{ text: '¡Mis defensas están forjadas en acero puro! A ver si tienes martillo para romperlas.', soundCue: '[Golpea el puño contra la palma] «¡Juguemos!»', state: 'Confident' }],

      NORMAL_MOVE: [{ text: 'Firme como la roca.', soundCue: '«Hmph.»', state: 'Thinking' }],

      CAPTURE: [{ text: '¡Directo a la fundición!', soundCue: '[El enano se ríe] «¡Ja, ja!»', state: 'Capture' }],

      PIECE_LOST: [{ text: '¡Bah! Solo es una abolladura en la armadura.', soundCue: '[Resopla] «Grr...»', state: 'PieceLost' }],

      QUEEN_CAPTURE: [{ text: '¡Eso no estaba en los planos, amigo! ¡Tu Dama se hizo añicos!', soundCue: '[Carcajada estruendosa] «¡Bahaha!»', state: 'Laugh' }],

      CHECK_GIVEN: [{ text: '¡El martillo cae sobre tu rey! ¡Jaque!', soundCue: '«¡Jaque!»', state: 'Confident' }],

      CHECK_RECEIVED: [{ text: '¡Por las barbas de mis ancestros! Buena brecha.', soundCue: '«¡Argh!»', state: 'Check' }],

      CASTLING: [{ text: '¡Cerrando las compuertas del bastión!', soundCue: '«Seguro.»', state: 'Confident' }],

      PROMOTION: [{ text: '¡Bien templado! Ese peón se ganó su armadura.', soundCue: '«¡Buen trabajo!»', state: 'Respect' }],

      TACTICAL_BLUNDER: [{ text: '¿Forjaste esa jugada con los ojos vendados o con estaño barato?', soundCue: '[Sacude la cabeza] «Qué chapuza...»', state: 'Taunt' }],

      BRILLIANT_MOVE: [{ text: '¡Un golpe maestro! Hasta yo admito una obra de arte cuando la veo.', soundCue: '«¡Por el yunque!»', state: 'BrilliantMove' }],

      RECOGNIZABLE_OPENING: [{ text: 'Conozco ese molde. Sólido y sin adornos.', soundCue: '«Ajá.»', state: 'Curious' }],

      REPETITION: [{ text: '¿Vas a golpear el mismo clavo toda la noche?', soundCue: '«¡Mueve de verdad!»', state: 'Annoyed' }],

      WINNING_POSITION: [{ text: '¡Tu posición tiene más grietas que una mina abandonada!', soundCue: '«¡Ríndete ya!»', state: 'Confident' }],

      DESPERATE_POSITION: [{ text: '¡Un enano nunca retrocede mientras quede carbón en el horno!', soundCue: '«¡Aguanta!»', state: 'DeepThinking' }],

      DRAW: [{ text: 'Ni tu acero se dobla ni el mío se quiebra. ¡Empate digno!', soundCue: '«¡Salud!»', state: 'Respect' }],

      VICTORY: [{ text: '¡Contra el Bastión de Hierro no valen trucos blandos!', soundCue: '«¡Victoria!»', state: 'Victory' }],

      DEFEAT: [{ text: 'Has partido mi yunque en dos. Te ganaste una jarra en mi salón.', soundCue: '«Honor a ti.»', state: 'Defeat' }],

      RESIGNATION: [{ text: '¿Ya apagas el fuego? Bueno, ahorramos carbón.', soundCue: '«Hmph.»', state: 'Confident' }]

    },

    challenges: []

  },

  {

    id: 'ash_throne',

    order: 4,

    name: 'Reino IV — El Trono de Ceniza',

    civilization: 'Hordas Orcas',

    rivalName: 'Señor de la Guerra Korgath',

    rivalTitle: 'El Devorador de Estandartes',

    recommendedDifficulty: 'intermediate',

    playStyle: {

      aggressionWeight: 1.6,

      defenseWeight: 0.7,

      description: 'Ataques frontales implacables, sacrificios agresivos y presión constante sobre el Rey.'

    },

    palette: {

      primary: 0x8b0000,

      secondary: 0x1c1c1c,

      accent: 0xff4500,

      ambientLight: 0xff5722,

      directionalLight: 0xff3d00,

      fogColor: 0x1a0505,

      fogDensity: 0.022

    },

    boardMaterials: {

      lightSquareColor: 0x9e8c7a,

      darkSquareColor: 0x1f1414,

      borderColor: 0x4a1212,

      roughness: 0.65,

      metalness: 0.3

    },

    handAppearance: { skinColor: 0x4a6b3b, armorColor: 0x2b2b2b, ringColor: 0xb71c1c, scale: 1.25 },

    musicTrack: '/assets/audio/music/realms/04_ash_throne.mp3',

    ambientElements: ['embers'],

    baseEmotions: { confidence: 90, frustration: 35, surprise: 10, respect: 20, aggressiveness: 95, patience: 30, tauntIntensity: 85 },

    dialogues: {

      GAME_START: [{ text: '¡Menos charla y más sangre en el tablero! ¡Mueve!', soundCue: '[Enseña los colmillos] «¡Grrr!»', state: 'Confident' }],

      NORMAL_MOVE: [{ text: '¿Solo eso? ¡Avanza!', soundCue: '«Tsk.»', state: 'Thinking' }],

      CAPTURE: [{ text: '¡Aplastado! ¡Otro trofeo para mi trono!', soundCue: '[El orco se ríe] «¡Ja, ja, ja!»', state: 'Capture' }],

      PIECE_LOST: [{ text: '¡Maldita rata escurridiza! ¡Lo pagarás caro!', soundCue: '[Golpea el reposabrazos] «¡Rah!»', state: 'PieceLost' }],

      QUEEN_CAPTURE: [{ text: '¡TU CAMPEONA HA CAÍDO! ¡Mira cómo huye tu ejército!', soundCue: '[Rugido triunfal] «¡WAHAHA!»', state: 'Laugh' }],

      CHECK_GIVEN: [{ text: '¡Huelo tu miedo desde aquí! ¡JAQUE!', soundCue: '«¡Jaque!»', state: 'Confident' }],

      CHECK_RECEIVED: [{ text: '¡¿Me amenazas a mí?! ¡Te arrancaré esa pieza!', soundCue: '«¡Grrr!»', state: 'Check' }],

      CASTLING: [{ text: '¡Cobarde! ¡Esconde a tu rey detrás de las faldas de la torre!', soundCue: '«¡Ja!»', state: 'Taunt' }],

      PROMOTION: [{ text: '¡Un soldado raso con corona sigue siendo carne de cañón!', soundCue: '«Hmph.»', state: 'Annoyed' }],

      TACTICAL_BLUNDER: [{ text: '¿Ese era tu gran plan? ¡Hasta mis goblins calculan mejor!', soundCue: '[Señala al jugador riendo] «¡Patético!»', state: 'Taunt' }],

      BRILLIANT_MOVE: [{ text: '¡Hah! ¡Tienes colmillos después de todo!', soundCue: '«¡Buen tajo!»', state: 'BrilliantMove' }],

      RECOGNIZABLE_OPENING: [{ text: 'Deja los libritos de academia y pelea de verdad.', soundCue: '«Aburrido...»', state: 'Annoyed' }],

      REPETITION: [{ text: '¡Si vuelves a repetir esa jugada vuelco la mesa!', soundCue: '«¡Pelea!»', state: 'Annoyed' }],

      WINNING_POSITION: [{ text: '¡Esto ya es una masacre!', soundCue: '«¡Fin del juego!»', state: 'Confident' }],

      DESPERATE_POSITION: [{ text: '¡Un jefe de guerra muere matando!', soundCue: '«¡No me rindo!»', state: 'DeepThinking' }],

      DRAW: [{ text: '¡Un empate sabe a ceniza! ¡Quiero la revancha!', soundCue: '«¡Bah!»', state: 'Annoyed' }],

      VICTORY: [{ text: '¡Vuelve cuando tengas agallas para soportar el fuego!', soundCue: '«¡Aplastado!»', state: 'Victory' }],

      DEFEAT: [{ text: 'Me has vencido en buena lid... ¡Toma el paso hacia la cumbre!', soundCue: '«Fuerte...»', state: 'Defeat' }],

      RESIGNATION: [{ text: '¡Corre, corre de vuelta al castillo!', soundCue: '«¡Cobarde!»', state: 'Laugh' }]

    },

    challenges: []

  },

  {

    id: 'draconic_empire',

    order: 5,

    name: 'Reino V — El Imperio Dracónico',

    civilization: 'Linaje Dracónico',

    rivalName: 'Emperador Ignis-Vael',

    rivalTitle: 'Soberano de la Obsidiana Ardiente',

    recommendedDifficulty: 'intermediate',

    playStyle: {

      aggressionWeight: 1.4,

      defenseWeight: 1.2,

      description: 'Dominio territorial absoluto, uso letal de la Dama y sacrificios posicionales de alto calibre.'

    },

    palette: {

      primary: 0xffaa00,

      secondary: 0x0d0d0d,

      accent: 0xd90429,

      ambientLight: 0xffbe0b,

      directionalLight: 0xfb5607,

      fogColor: 0x0f0704,

      fogDensity: 0.016

    },

    boardMaterials: {

      lightSquareColor: 0xf4d58d,

      darkSquareColor: 0x141414,

      borderColor: 0xd4af37,

      roughness: 0.15,

      metalness: 0.65

    },

    handAppearance: { skinColor: 0x8d2323, armorColor: 0xd4af37, ringColor: 0xff0000, scale: 1.1 },

    musicTrack: '/assets/audio/music/realms/05_draconic_empire.mp3',

    ambientElements: ['embers', 'candles'],

    baseEmotions: { confidence: 95, frustration: 15, surprise: 5, respect: 15, aggressiveness: 80, patience: 70, tauntIntensity: 75 },

    dialogues: {

      GAME_START: [{ text: 'Contempla el ápice de la creación. Tus sesenta y cuatro casillas son mi territorio de caza.', soundCue: '[Exhala humo] «Fsshh...»', state: 'Confident' }],

      NORMAL_MOVE: [{ text: 'Te arrastras por el suelo mientras yo observo desde las alturas.', soundCue: '«Mmm.»', state: 'Thinking' }],

      CAPTURE: [{ text: 'Reducido a cenizas.', soundCue: '«Consumido.»', state: 'Capture' }],

      PIECE_LOST: [{ text: 'Una escama desprendida no detiene al dragón.', soundCue: '«Insignificante.»', state: 'PieceLost' }],

      QUEEN_CAPTURE: [{ text: 'Solo puede existir un depredador supremo en este tablero.', soundCue: '[Sonrisa imponente] «¡Ja!»', state: 'Laugh' }],

      CHECK_GIVEN: [{ text: 'Siente el aliento del fuego imperial. Jaque.', soundCue: '«Jaque.»', state: 'Confident' }],

      CHECK_RECEIVED: [{ text: '¡¿Osas alzar tu lanza contra mis escamas?!', soundCue: '«¡Insolencia!»', state: 'Check' }],

      CASTLING: [{ text: 'Te ocultas en tu cueva.', soundCue: '«Previsible.»', state: 'Thinking' }],

      PROMOTION: [{ text: 'Un mortal pretende ascender a mi altura.', soundCue: '«Curioso.»', state: 'Curious' }],

      TACTICAL_BLUNDER: [{ text: 'Entregaste tu flanco como una ofrenda voluntaria.', soundCue: '«Decepcionante.»', state: 'Taunt' }],

      BRILLIANT_MOVE: [{ text: 'Una chispa de verdadero fuego estratégico.', soundCue: '«Digno.»', state: 'BrilliantMove' }],

      RECOGNIZABLE_OPENING: [{ text: 'Estrategias de eras olvidadas.', soundCue: '«Antiguo.»', state: 'Idle' }],

      REPETITION: [{ text: 'No pongas a prueba mi paciencia milenaria.', soundCue: '«Basta.»', state: 'Annoyed' }],

      WINNING_POSITION: [{ text: 'El cielo se cierra sobre tu ejército.', soundCue: '«Inclínate.»', state: 'Confident' }],

      DESPERATE_POSITION: [{ text: 'El fuego arde con más violencia cuando se le acorrala.', soundCue: '«Grrr...»', state: 'DeepThinking' }],

      DRAW: [{ text: 'Has sobrevivido al fuego sin quemarte. Eso ya es un triunfo para ti.', soundCue: '«Empate.»', state: 'Respect' }],

      VICTORY: [{ text: 'Todo regresa al oro y a la ceniza.', soundCue: '«Supremo.»', state: 'Victory' }],

      DEFEAT: [{ text: 'Imposible... Has domado la tormenta de fuego.', soundCue: '«Reconozco tu poder.»', state: 'Defeat' }],

      RESIGNATION: [{ text: 'Postrarse a tiempo evita la aniquilación.', soundCue: '«Aceptado.»', state: 'Confident' }]

    },

    challenges: []

  },

  {

    id: 'shadow_court',

    order: 6,

    name: 'Reino VI — La Corte de las Sombras',

    civilization: 'Nobleza Nocturna',

    rivalName: 'Lord Valerius',

    rivalTitle: 'El Conde del Crepúsculo Carmesí',

    recommendedDifficulty: 'advanced',

    playStyle: {

      aggressionWeight: 1.2,

      defenseWeight: 1.2,

      description: 'Clavadas psicológicas, ataques dobles ocultos y desgaste lento de los recursos rivales.'

    },

    palette: {

      primary: 0x590d22,

      secondary: 0x111116,

      accent: 0x9d4edd,

      ambientLight: 0xc9184a,

      directionalLight: 0xe0aaff,

      fogColor: 0x0a0408,

      fogDensity: 0.02

    },

    boardMaterials: {

      lightSquareColor: 0xd8c8d8,

      darkSquareColor: 0x240b15,

      borderColor: 0x800f2f,

      roughness: 0.25,

      metalness: 0.5

    },

    handAppearance: { skinColor: 0xe5e5e5, armorColor: 0x2b0912, ringColor: 0xa4133c, scale: 0.96 },

    musicTrack: '/assets/audio/music/realms/06_shadow_court.mp3',

    ambientElements: ['candles', 'dust'],

    baseEmotions: { confidence: 85, frustration: 10, surprise: 5, respect: 35, aggressiveness: 60, patience: 90, tauntIntensity: 80 },

    dialogues: {

      GAME_START: [{ text: 'La noche es joven y tu pulso ya suena acelerado. Toma asiento.', soundCue: '[Gira suavemente su copa] «Bienvenido.»', state: 'Confident' }],

      NORMAL_MOVE: [{ text: 'Caminas de puntillas por el salón.', soundCue: '«Hmm...»', state: 'Thinking' }],

      CAPTURE: [{ text: 'Exquisito. Ni siquiera sintió el mordisco.', soundCue: '[Sonríe mostrando los colmillos] «Delicioso.»', state: 'Capture' }],

      PIECE_LOST: [{ text: 'Un peón descartable en una intriga mayor.', soundCue: '«Qué descortés.»', state: 'PieceLost' }],

      QUEEN_CAPTURE: [{ text: 'Tu Dama bailó demasiado cerca de las sombras.', soundCue: '[Risa elegante] «Ja, ja...»', state: 'Laugh' }],

      CHECK_GIVEN: [{ text: 'Tu yugular está descubierta, querido invitado. Jaque.', soundCue: '«Jaque.»', state: 'Confident' }],

      CHECK_RECEIVED: [{ text: 'Una estaca inesperada... tienes modales rudos.', soundCue: '«Tsk.»', state: 'Check' }],

      CASTLING: [{ text: 'Cerrando las cortinas antes de medianoche.', soundCue: '«Cauto.»', state: 'Thinking' }],

      PROMOTION: [{ text: 'Una metamorfosis fascinante.', soundCue: '«Oh...»', state: 'Curious' }],

      TACTICAL_BLUNDER: [{ text: '¿Fue un regalo de cortesía o simplemente perdiste la sangre fría?', soundCue: '[Lleva una mano al pecho con ironía] «Qué tragedia.»', state: 'Taunt' }],

      BRILLIANT_MOVE: [{ text: 'Brillante y cruel. Casi pareces uno de los nuestros.', soundCue: '«Magnífico.»', state: 'BrilliantMove' }],

      RECOGNIZABLE_OPENING: [{ text: 'Un baile de salón clásico.', soundCue: '«Elegante.»', state: 'Idle' }],

      REPETITION: [{ text: 'La inmortalidad puede ser tediosa si repites siempre el mismo paso.', soundCue: '«Sorpréndeme.»', state: 'Annoyed' }],

      WINNING_POSITION: [{ text: 'Te estás quedando sin aliento y sin casillas.', soundCue: '«Buenas noches.»', state: 'Confident' }],

      DESPERATE_POSITION: [{ text: 'La luz del alba aún está lejos...', soundCue: '«...»', state: 'DeepThinking' }],

      DRAW: [{ text: 'Un brindis sin vencedores ni vencidos.', soundCue: '«Tablas.»', state: 'Respect' }],

      VICTORY: [{ text: 'Fue un placer drenar tus esperanzas jugada tras jugada.', soundCue: '«Dulces sueños.»', state: 'Victory' }],

      DEFEAT: [{ text: 'Me has dejado sin réplica. Mis respetos desde la penumbra.', soundCue: '«Touché.»', state: 'Defeat' }],

      RESIGNATION: [{ text: 'Huyes antes del último acto. Comprensible.', soundCue: '«Adiós.»', state: 'Confident' }]

    },

    challenges: []

  },

  {

    id: 'celestial_sanctuary',

    order: 7,

    name: 'Reino VII — El Santuario Celestial',

    civilization: 'Guardianes Empíreos',

    rivalName: 'Arcángel Seraphiel',

    rivalTitle: 'Custodio del Orden Geométrico',

    recommendedDifficulty: 'advanced',

    playStyle: {

      aggressionWeight: 1.0,

      defenseWeight: 1.5,

      description: 'Armonía posicional perfecta, coordinación simétrica y profilaxis absoluta.'

    },

    palette: {

      primary: 0xffd166,

      secondary: 0xf8f9fa,

      accent: 0x4cc9f0,

      ambientLight: 0xffffff,

      directionalLight: 0xffe599,

      fogColor: 0xdbe9f4,

      fogDensity: 0.01

    },

    boardMaterials: {

      lightSquareColor: 0xffffff,

      darkSquareColor: 0x8ecae6,

      borderColor: 0xffd166,

      roughness: 0.15,

      metalness: 0.45

    },

    handAppearance: { skinColor: 0xfefae0, armorColor: 0xffd166, ringColor: 0x4cc9f0, scale: 1.0 },

    musicTrack: '/assets/audio/music/realms/07_celestial_sanctuary.mp3',

    ambientElements: ['magic_runes'],

    baseEmotions: { confidence: 90, frustration: 0, surprise: 5, respect: 60, aggressiveness: 40, patience: 100, tauntIntensity: 20 },

    dialogues: {

      GAME_START: [{ text: 'Que cada movimiento refleje la claridad de tu espíritu. Comienza la prueba.', soundCue: '[Junta las manos con serenidad] «Comencemos.»', state: 'Idle' }],

      NORMAL_MOVE: [{ text: 'El orden se mantiene.', soundCue: '«...»', state: 'Thinking' }],

      CAPTURE: [{ text: 'Toda desarmonía en el tablero debe ser corregida.', soundCue: '«Purificado.»', state: 'Capture' }],

      PIECE_LOST: [{ text: 'Una entrega necesaria para preservar el equilibrio.', soundCue: '«Así sea.»', state: 'PieceLost' }],

      QUEEN_CAPTURE: [{ text: 'Tu orgullo descansaba demasiado en una sola pieza.', soundCue: '«Juicio cumplido.»', state: 'Confident' }],

      CHECK_GIVEN: [{ text: 'La luz revela tu vulnerabilidad. Jaque.', soundCue: '«Jaque.»', state: 'Confident' }],

      CHECK_RECEIVED: [{ text: 'Una prueba severa para mi guardia.', soundCue: '«Firmeza.»', state: 'Check' }],

      CASTLING: [{ text: 'El templo protege su núcleo.', soundCue: '«Orden.»', state: 'Thinking' }],

      PROMOTION: [{ text: 'La perseverancia alcanza su ascensión.', soundCue: '«Digno.»', state: 'Respect' }],

      TACTICAL_BLUNDER: [{ text: 'Tu mente se nubló por un instante. En estas alturas, eso basta para caer.', soundCue: '[Cierra los ojos con decepción contenida] «Lamentable.»', state: 'Blunder' }],

      BRILLIANT_MOVE: [{ text: 'Una geometría impecable. Has visto la verdad oculta en la posición.', soundCue: '[Asiente con profundo respeto] «Sublime.»', state: 'BrilliantMove' }],

      RECOGNIZABLE_OPENING: [{ text: 'Los cánones clásicos honran a quienes los estudian.', soundCue: '«Armonioso.»', state: 'Curious' }],

      REPETITION: [{ text: 'La eternidad no teme al ciclo, pero tú debes demostrar avance.', soundCue: '«Decide.»', state: 'Thinking' }],

      WINNING_POSITION: [{ text: 'La balanza se ha inclinado de forma irreversible.', soundCue: '«Acepta el juicio.»', state: 'Confident' }],

      DESPERATE_POSITION: [{ text: 'Incluso ante la tormenta, el guardián permanece en su puesto.', soundCue: '«Serenidad.»', state: 'DeepThinking' }],

      DRAW: [{ text: 'Dos fuerzas en perfecto equilibrio.', soundCue: '«Paz.»', state: 'Respect' }],

      VICTORY: [{ text: 'Aún debes pulir tu disciplina antes de reclamar los tronos superiores.', soundCue: '«Prueba concluida.»', state: 'Victory' }],

      DEFEAT: [{ text: 'Tu claridad estratégica ha superado mi vigilancia. El paso es tuyo.', soundCue: '«Bendito sea tu ingenio.»', state: 'Defeat' }],

      RESIGNATION: [{ text: 'Reconocer el límite propio es el principio de la sabiduría.', soundCue: '«En paz.»', state: 'Respect' }]

    },

    challenges: []

  },

  {

    id: 'snow_dominion',

    order: 8,

    name: 'Reino VIII — El Dominio de las Nieves',

    civilization: 'Clanes del Norte',

    rivalName: 'Jarl Freydis',

    rivalTitle: 'La Loba del Invierno Eterno',

    recommendedDifficulty: 'expert',

    playStyle: {

      aggressionWeight: 1.3,

      defenseWeight: 1.4,

      description: 'Resistencia implacable, contragolpes letales tras absorber el ataque y finales de peones precisos.'

    },

    palette: {

      primary: 0x90e0ef,

      secondary: 0x343a40,

      accent: 0xf77f00,

      ambientLight: 0xcaf0f8,

      directionalLight: 0xffb703,

      fogColor: 0x0f1c24,

      fogDensity: 0.022

    },

    boardMaterials: {

      lightSquareColor: 0xe0fbfc,

      darkSquareColor: 0x293241,

      borderColor: 0x5c677d,

      roughness: 0.4,

      metalness: 0.35

    },

    handAppearance: { skinColor: 0xeddcd2, armorColor: 0x495057, ringColor: 0x90e0ef, scale: 1.05 },

    musicTrack: '/assets/audio/music/realms/08_snow_dominion.mp3',

    ambientElements: ['snow', 'embers'],

    baseEmotions: { confidence: 85, frustration: 15, surprise: 10, respect: 50, aggressiveness: 70, patience: 85, tauntIntensity: 65 },

    dialogues: {

      GAME_START: [{ text: 'En el norte, los que atacan sin provisiones mueren congelados. Veamos cuánto aguantas.', soundCue: '[Sopla sobre sus dedos] «Hace frío hoy.»', state: 'Confident' }],

      NORMAL_MOVE: [{ text: 'Paso firme sobre el hielo.', soundCue: '«Mmm.»', state: 'Thinking' }],

      CAPTURE: [{ text: 'El invierno se cobra otra víctima.', soundCue: '«Tuya ya no es.»', state: 'Capture' }],

      PIECE_LOST: [{ text: 'Una herida superficial. He soportado ventiscas peores.', soundCue: '«Tsk.»', state: 'PieceLost' }],

      QUEEN_CAPTURE: [{ text: '¡Tu pieza más fuerte acaba de hundirse en el hielo quebradizo!', soundCue: '[Risa franca] «¡Ja, ja!»', state: 'Laugh' }],

      CHECK_GIVEN: [{ text: 'El viento helado entra en tu tienda. ¡Jaque!', soundCue: '«¡Jaque!»', state: 'Confident' }],

      CHECK_RECEIVED: [{ text: '¡Hah! ¡Un golpe directo al escudo!', soundCue: '«¡Bien!»', state: 'Check' }],

      CASTLING: [{ text: 'Encendiendo la hoguera tras los muros.', soundCue: '«Sensato.»', state: 'Thinking' }],

      PROMOTION: [{ text: 'Quien cruza toda la tundra merece liderar la manada.', soundCue: '«Bravo.»', state: 'Respect' }],

      TACTICAL_BLUNDER: [{ text: 'Corriste sobre hielo fino sin mirar abajo.', soundCue: '[Niega con la cabeza] «Error de novato.»', state: 'Taunt' }],

      BRILLIANT_MOVE: [{ text: '¡Por los dioses del frío! Esa estocada fue digna de una saga.', soundCue: '«¡Magnífico!»', state: 'BrilliantMove' }],

      RECOGNIZABLE_OPENING: [{ text: 'Viejas tácticas de escudo.', soundCue: '«Conocido.»', state: 'Idle' }],

      REPETITION: [{ text: '¿Tienes los pies congelados en la misma casilla?', soundCue: '«Avanza.»', state: 'Annoyed' }],

      WINNING_POSITION: [{ text: 'La tormenta te ha dejado sin suministros.', soundCue: '«Se acabó.»', state: 'Confident' }],

      DESPERATE_POSITION: [{ text: 'Mientras quede aliento, el clan resiste.', soundCue: '«...»', state: 'DeepThinking' }],

      DRAW: [{ text: 'Ambos sobrevivimos a la ventisca. Hoy brindaremos juntos.', soundCue: '«Empate honorable.»', state: 'Respect' }],

      VICTORY: [{ text: 'El frío siempre gana a los impacientes.', soundCue: '«Victoria del norte.»', state: 'Victory' }],

      DEFEAT: [{ text: 'Tu fuego interior derritió mis defensas. Avanza con mi respeto.', soundCue: '«Gran duelo.»', state: 'Defeat' }],

      RESIGNATION: [{ text: 'Retirarse antes de la congelación es de sabios.', soundCue: '«Vuelve al calor.»', state: 'Confident' }]

    },

    challenges: []

  },

  {

    id: 'sand_kingdom',

    order: 9,

    name: 'Reino IX — El Reino de las Arenas',

    civilization: 'Sultanato de Espejismos',

    rivalName: 'Sultán Rashid al-Zahir',

    rivalTitle: 'El Mercader de Destinos',

    recommendedDifficulty: 'expert',

    playStyle: {

      aggressionWeight: 1.35,

      defenseWeight: 1.35,

      description: 'Tácticas complejas, intercambios engañosos, sacrificios de desviación y cálculo profundo.'

    },

    palette: {

      primary: 0x00b4d8,

      secondary: 0x1d3557,

      accent: 0xffb703,

      ambientLight: 0xffd166,

      directionalLight: 0x0096c7,

      fogColor: 0x0b132b,

      fogDensity: 0.014

    },

    boardMaterials: {

      lightSquareColor: 0xfaf0ca,

      darkSquareColor: 0x0d3b66,

      borderColor: 0xf4d35e,

      roughness: 0.2,

      metalness: 0.55

    },

    handAppearance: { skinColor: 0xb5835a, armorColor: 0xf4d35e, ringColor: 0x00b4d8, scale: 1.0 },

    musicTrack: '/assets/audio/music/realms/09_sand_kingdom.mp3',

    ambientElements: ['candles', 'dust'],

    baseEmotions: { confidence: 90, frustration: 10, surprise: 10, respect: 45, aggressiveness: 65, patience: 90, tauntIntensity: 70 },

    dialogues: {

      GAME_START: [{ text: 'Toda partida es una negociación donde la moneda es el tiempo. ¿Qué estás dispuesto a apostar hoy?', soundCue: '[Gira su anillo de lapislázuli] «Hablemos de negocios.»', state: 'Confident' }],

      NORMAL_MOVE: [{ text: 'Una oferta prudente.', soundCue: '«Mmm...»', state: 'Thinking' }],

      CAPTURE: [{ text: 'Un intercambio sumamente rentable para mi tesoro.', soundCue: '[Abre la palma con elegancia] «Gracias.»', state: 'Capture' }],

      PIECE_LOST: [{ text: 'El costo de hacer negocios en el gran bazar.', soundCue: '«Aceptable.»', state: 'PieceLost' }],

      QUEEN_CAPTURE: [{ text: '¡Apostaste la joya de tu corona a un espejismo!', soundCue: '[Sonrisa pícara] «¡Ja, ja!»', state: 'Laugh' }],

      CHECK_GIVEN: [{ text: 'Es hora de saldar las cuentas. Jaque al Rey.', soundCue: '«Jaque.»', state: 'Confident' }],

      CHECK_RECEIVED: [{ text: 'Una cláusula oculta en el contrato... bien visto.', soundCue: '«¡Ah!»', state: 'Check' }],

      CASTLING: [{ text: 'Guardando el oro en la cámara acorazada.', soundCue: '«Seguro.»', state: 'Thinking' }],

      PROMOTION: [{ text: 'Una inversión modesta que rinde intereses extraordinarios.', soundCue: '«Magnífico negocio.»', state: 'Respect' }],

      TACTICAL_BLUNDER: [{ text: 'Acabas de venderme un palacio por el precio de un grano de arena.', soundCue: '[Extiende ambas manos sonriendo] «Qué generosidad.»', state: 'Taunt' }],

      BRILLIANT_MOVE: [{ text: '¡Una jugada digna de las mil y una leyendas! Me has dejado sin margen.', soundCue: '«¡Excepcional!»', state: 'BrilliantMove' }],

      RECOGNIZABLE_OPENING: [{ text: 'Las rutas comerciales clásicas siguen siendo las más transitadas.', soundCue: '«Clásico.»', state: 'Curious' }],

      REPETITION: [{ text: 'Regatear con el mismo precio tres veces no cambiará mi respuesta.', soundCue: '«Cambia la oferta.»', state: 'Annoyed' }],

      WINNING_POSITION: [{ text: 'Las arenas del reloj se agotan y el saldo está a mi favor.', soundCue: '«Es el fin.»', state: 'Confident' }],

      DESPERATE_POSITION: [{ text: 'Aún queda una última carta bajo la manga de seda...', soundCue: '«Veamos...»', state: 'DeepThinking' }],

      DRAW: [{ text: 'Un contrato donde ambas partes conservan su fortuna.', soundCue: '«Trato justo.»', state: 'Respect' }],

      VICTORY: [{ text: 'Nunca apuestes contra quien conoce cada duna del desierto.', soundCue: '«Placer negociar contigo.»', state: 'Victory' }],

      DEFEAT: [{ text: 'Has superado al maestro de las apuestas. El último umbral te espera.', soundCue: '«Tuyo es el premio.»', state: 'Defeat' }],

      RESIGNATION: [{ text: 'Declararse en bancarrota a tiempo evita deudas mayores.', soundCue: '«Sabia retirada.»', state: 'Confident' }]

    },

    challenges: []

  },

  {

    id: 'void_throne',

    order: 10,

    name: 'Reino X — El Trono del Vacío',

    civilization: 'Entidades del Horizonte Arcano',

    rivalName: 'Nul-Aethel',

    rivalTitle: 'El Arquitecto de las Infinitas Variantes',

    recommendedDifficulty: 'master',

    playStyle: {

      aggressionWeight: 1.5,

      defenseWeight: 1.5,

      description: 'Cálculo de profundidad máxima, jugadas profilácticas inhumanas y dominio táctico absoluto.'

    },

    palette: {

      primary: 0x3a0ca3,

      secondary: 0x05050a,

      accent: 0x00f5d4,

      ambientLight: 0x7209b7,

      directionalLight: 0x4cc9f0,

      fogColor: 0x030108,

      fogDensity: 0.025

    },

    boardMaterials: {

      lightSquareColor: 0xc77dff,

      darkSquareColor: 0x10002b,

      borderColor: 0x00f5d4,

      roughness: 0.1,

      metalness: 0.85

    },

    handAppearance: { skinColor: 0x240046, armorColor: 0x00f5d4, ringColor: 0xf72585, scale: 1.08 },

    musicTrack: '/assets/audio/music/realms/10_void_throne.mp3',

    ambientElements: ['void_shards', 'magic_runes'],

    baseEmotions: { confidence: 100, frustration: 0, surprise: 0, respect: 50, aggressiveness: 85, patience: 100, tauntIntensity: 60 },

    dialogues: {

      GAME_START: [{ text: 'En diez millones de líneas temporales llegaste hasta aquí. En casi todas, ya has perdido.', soundCue: '[Inclina la cabeza en un ángulo antinatural] «Observemos esta.»', state: 'Confident' }],

      NORMAL_MOVE: [{ text: 'Una bifurcación menor en el tejido.', soundCue: '«...»', state: 'Thinking' }],

      CAPTURE: [{ text: 'Esa pieza nunca existió realmente.', soundCue: '[Eco distorsionado] «Borrado.»', state: 'Capture' }],

      PIECE_LOST: [{ text: 'Materia intercambiada por entropía.', soundCue: '«Irrelevante.»', state: 'PieceLost' }],

      QUEEN_CAPTURE: [{ text: 'Incluso las estrellas más brillantes colapsan en el vacío.', soundCue: '[Sonrisa repentina] «Silencio.»', state: 'Laugh' }],

      CHECK_GIVEN: [{ text: 'Todas tus salidas convergen en el mismo punto. Jaque.', soundCue: '«Jaque.»', state: 'Confident' }],

      CHECK_RECEIVED: [{ text: 'Una anomalía estadística interesante.', soundCue: '«¿Oh?»', state: 'Check' }],

      CASTLING: [{ text: 'Alteras la geometría local buscando refugio.', soundCue: '«Curioso.»', state: 'Thinking' }],

      PROMOTION: [{ text: 'Un fragmento finito alcanza su potencial máximo.', soundCue: '«Trascendencia.»', state: 'Respect' }],

      TACTICAL_BLUNDER: [{ text: 'Había 34 movimientos legales y elegiste el que colapsa tu universo más rápido.', soundCue: '[Pausa prolongada y risa suave] «Fascinante error.»', state: 'Taunt' }],

      BRILLIANT_MOVE: [{ text: 'Acabas de crear una línea temporal que ni siquiera yo había contemplado.', soundCue: '«¡Singularidad!»', state: 'BrilliantMove' }],

      RECOGNIZABLE_OPENING: [{ text: 'Ecos de mentes antiguas que intentaron poner orden al caos.', soundCue: '«Conocido.»', state: 'Idle' }],

      REPETITION: [{ text: 'Un bucle temporal cerrado. ¿Deseas permanecer aquí para siempre?', soundCue: '«Bucle.»', state: 'Curious' }],

      WINNING_POSITION: [{ text: 'El horizonte de sucesos ya ha cruzado tu primera fila.', soundCue: '«Inevitabilidad.»', state: 'Confident' }],

      DESPERATE_POSITION: [{ text: 'Las probabilidades se invierten... recalculando el vacío.', soundCue: '«...»', state: 'DeepThinking' }],

      DRAW: [{ text: 'Cero neto. La suma perfecta del cosmos.', soundCue: '«Equilibrio.»', state: 'Respect' }],

      VICTORY: [{ text: 'El resultado converge con la profecía matemática.', soundCue: '«Fin del ciclo.»', state: 'Victory' }],

      DEFEAT: [{ text: 'Has roto el determinismo del tablero. Los Diez Tronos te pertenecen.', soundCue: '«Eres la anomalía.»', state: 'Defeat' }],

      RESIGNATION: [{ text: 'Abandonas esta realidad para intentar otra.', soundCue: '«Disolución.»', state: 'Confident' }]

    },

    challenges: []

  }

];
