// src/core/types.ts

export type DifficultyLevel = 'beginner' | 'easy' | 'intermediate' | 'advanced' | 'expert' | 'master';

export type PieceColor = 'w' | 'b';

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';



export type CharacterAnimationState =

  | 'Idle' | 'Thinking' | 'DeepThinking' | 'Confident' | 'Curious'

  | 'Surprised' | 'Capture' | 'PieceLost' | 'Check' | 'Checkmate'

  | 'Victory' | 'Defeat' | 'Blunder' | 'BrilliantMove' | 'Taunt'

  | 'Respect' | 'Annoyed' | 'Laugh';



export type GameEventType =

  | 'GAME_START' | 'RECOGNIZABLE_OPENING' | 'NORMAL_MOVE' | 'CAPTURE'

  | 'PIECE_LOST' | 'QUEEN_CAPTURE' | 'CHECK_GIVEN' | 'CHECK_RECEIVED'

  | 'CASTLING' | 'PROMOTION' | 'TACTICAL_BLUNDER' | 'BRILLIANT_MOVE'

  | 'REPETITION' | 'WINNING_POSITION' | 'DESPERATE_POSITION'

  | 'DRAW' | 'VICTORY' | 'DEFEAT' | 'RESIGNATION';



export interface EmotionalState {

  confidence: number;      // 0 - 100

  frustration: number;     // 0 - 100

  surprise: number;        // 0 - 100

  respect: number;         // 0 - 100

  aggressiveness: number;  // 0 - 100

  patience: number;        // 0 - 100

  tauntIntensity: number;  // 0 - 100

}



export interface MoveResult {

  from: string;

  to: string;

  piece: PieceSymbol;

  color: PieceColor;

  captured?: PieceSymbol;

  promotion?: PieceSymbol;

  san: string;

  flags: string;

  fenBefore: string;

  fenAfter: string;

  isCheck: boolean;

  isCheckmate: boolean;

  isDraw: boolean;

  isStalemate: boolean;

  isThreefoldRepetition: boolean;

  evaluationDelta?: number;

}



export interface RealmConfig {

  id: string;

  order: number;

  name: string;

  civilization: string;

  rivalName: string;

  rivalTitle: string;

  recommendedDifficulty: DifficultyLevel;

  playStyle: {

    aggressionWeight: number;

    defenseWeight: number;

    description: string;

  };

  palette: {

    primary: number;

    secondary: number;

    accent: number;

    ambientLight: number;

    directionalLight: number;

    fogColor: number;

    fogDensity: number;

  };

  boardMaterials: {

    lightSquareColor: number;

    darkSquareColor: number;

    borderColor: number;

    roughness: number;

    metalness: number;

  };

  handAppearance: {

    skinColor: number;

    armorColor: number;

    ringColor: number;

    scale: number;

  };

  musicTrack: string;

  ambientElements: ('candles' | 'embers' | 'snow' | 'magic_runes' | 'dust' | 'leaves' | 'void_shards')[];

  baseEmotions: EmotionalState;

  dialogues: Record<GameEventType, { text: string; soundCue: string; state: CharacterAnimationState }[]>;

  challenges: {

    id: string;

    title: string;

    description: string;

    initialFen: string;

    objective: 'checkmate' | 'survive_moves' | 'win_material';

    moveLimit?: number;

  }[];

}



export interface GameSettings {

  graphics: {

    quality: 'low' | 'medium' | 'high' | 'ultra';

    shadows: boolean;

    particles: boolean;

    antialiasing: boolean;

    renderScale: number;

    cinematicAnimations: boolean;

  };

  audio: {

    master: number;

    music: number;

    sfx: number;

    voice: number;

    muted: boolean;

  };

  gameplay: {

    defaultDifficulty: DifficultyLevel;

    showLegalMoves: boolean;

    confirmMoves: boolean;

    animationSpeed: number;

    boardOrientation: PieceColor;

  };

  accessibility: {

    uiScale: number;

    highContrast: boolean;

    reducedMotion: boolean;

    disableTaunts: boolean;

    showSubtitles: boolean;

  };

}
