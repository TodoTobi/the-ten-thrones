// src/rendering/RivalAvatar2D.ts
import { CharacterAnimationState, RealmConfig } from '../core/types';

export type ExpressionPresetName =
  | 'neutral_attentive'
  | 'focused_calculation'
  | 'suspicion'
  | 'mild_amusement'
  | 'arrogant_smirk'
  | 'confident_grin'
  | 'surprise'
  | 'disbelief'
  | 'irritation'
  | 'suppressed_anger'
  | 'open_anger'
  | 'intense_fury'
  | 'disappointment'
  | 'reluctant_respect'
  | 'fear_concern'
  | 'victory'
  | 'defeat'
  | 'exhaustion';

export interface FacialRigChannels {
  leftEyelidUpper: number;   // 0 (open) to 1 (closed)
  rightEyelidUpper: number;  // 0 (open) to 1 (closed)
  eyelidLowerSquint: number; // 0 to 1
  gazeX: number;             // -1 (left) to +1 (right)
  gazeY: number;             // -1 (up) to +1 (down toward board)
  browInnerLeftY: number;    // -1 (furrowed down) to +1 (raised)
  browInnerRightY: number;
  browOuterLeftY: number;
  browOuterRightY: number;
  mouthCornerLeftY: number;  // -1 (frown) to +1 (smile/smirk)
  mouthCornerRightY: number;
  jawOpen: number;           // 0 (closed) to 1 (wide open)
  lipPucker: number;         // 0 to 1
  headYaw: number;           // -15 to +15 deg
  headPitch: number;         // -15 to +15 deg
  headRoll: number;          // -12 to +12 deg
  torsoLeanY: number;        // -10 (lean forward) to +10 (lean back)
  rightArmElevation: number; // 0 (on armrest) to 1 (raised/chin/slam)
}

const DEFAULT_CHANNELS: FacialRigChannels = {
  leftEyelidUpper: 0.08,
  rightEyelidUpper: 0.08,
  eyelidLowerSquint: 0.0,
  gazeX: 0.0,
  gazeY: 0.15,
  browInnerLeftY: 0.0,
  browInnerRightY: 0.0,
  browOuterLeftY: 0.0,
  browOuterRightY: 0.0,
  mouthCornerLeftY: 0.0,
  mouthCornerRightY: 0.0,
  jawOpen: 0.0,
  lipPucker: 0.0,
  headYaw: 0.0,
  headPitch: 2.0,
  headRoll: 0.0,
  torsoLeanY: 0.0,
  rightArmElevation: 0.0,
};

export const EXPRESSION_PRESETS: Record<ExpressionPresetName, Partial<FacialRigChannels>> = {
  neutral_attentive: { leftEyelidUpper: 0.08, rightEyelidUpper: 0.08, gazeY: 0.2, headPitch: 2 },
  focused_calculation: {
    leftEyelidUpper: 0.22, rightEyelidUpper: 0.22, eyelidLowerSquint: 0.35,
    browInnerLeftY: -0.45, browInnerRightY: -0.45, gazeY: 0.65, headPitch: 6, torsoLeanY: -4, rightArmElevation: 0.65
  },
  suspicion: {
    leftEyelidUpper: 0.38, rightEyelidUpper: 0.12, eyelidLowerSquint: 0.5,
    browInnerLeftY: -0.6, browInnerRightY: 0.35, browOuterRightY: 0.4, headYaw: -5, headRoll: 3
  },
  mild_amusement: {
    leftEyelidUpper: 0.15, rightEyelidUpper: 0.15, eyelidLowerSquint: 0.25,
    mouthCornerLeftY: 0.35, mouthCornerRightY: 0.4, browOuterLeftY: 0.2, browOuterRightY: 0.2
  },
  arrogant_smirk: {
    leftEyelidUpper: 0.3, rightEyelidUpper: 0.18,
    browInnerLeftY: -0.2, browInnerRightY: 0.45, browOuterRightY: 0.5,
    mouthCornerLeftY: -0.05, mouthCornerRightY: 0.75, headPitch: -5, headRoll: -4
  },
  confident_grin: {
    leftEyelidUpper: 0.1, rightEyelidUpper: 0.1,
    mouthCornerLeftY: 0.7, mouthCornerRightY: 0.7, jawOpen: 0.25, headPitch: -3
  },
  surprise: {
    leftEyelidUpper: 0.0, rightEyelidUpper: 0.0,
    browInnerLeftY: 0.85, browInnerRightY: 0.85, browOuterLeftY: 0.75, browOuterRightY: 0.75,
    jawOpen: 0.45, headPitch: -4, torsoLeanY: 4
  },
  disbelief: {
    leftEyelidUpper: 0.0, rightEyelidUpper: 0.25,
    browInnerLeftY: 0.8, browInnerRightY: -0.3, mouthCornerLeftY: -0.35, mouthCornerRightY: -0.2,
    jawOpen: 0.3, headRoll: 6
  },
  irritation: {
    leftEyelidUpper: 0.25, rightEyelidUpper: 0.25, eyelidLowerSquint: 0.45,
    browInnerLeftY: -0.65, browInnerRightY: -0.65, mouthCornerLeftY: -0.45, mouthCornerRightY: -0.45
  },
  suppressed_anger: {
    leftEyelidUpper: 0.32, rightEyelidUpper: 0.32, eyelidLowerSquint: 0.6,
    browInnerLeftY: -0.8, browInnerRightY: -0.8, mouthCornerLeftY: -0.6, mouthCornerRightY: -0.6,
    headPitch: 5, torsoLeanY: -3
  },
  open_anger: {
    leftEyelidUpper: 0.05, rightEyelidUpper: 0.05, eyelidLowerSquint: 0.4,
    browInnerLeftY: -0.95, browInnerRightY: -0.95, browOuterLeftY: 0.3, browOuterRightY: 0.3,
    mouthCornerLeftY: -0.75, mouthCornerRightY: -0.75, jawOpen: 0.55, headPitch: 6, torsoLeanY: -6
  },
  intense_fury: {
    leftEyelidUpper: 0.0, rightEyelidUpper: 0.0, eyelidLowerSquint: 0.55,
    browInnerLeftY: -1.0, browInnerRightY: -1.0, browOuterLeftY: 0.5, browOuterRightY: 0.5,
    mouthCornerLeftY: -0.9, mouthCornerRightY: -0.9, jawOpen: 0.8, headPitch: 8, torsoLeanY: -8
  },
  disappointment: {
    leftEyelidUpper: 0.55, rightEyelidUpper: 0.55,
    browInnerLeftY: 0.3, browInnerRightY: 0.3, browOuterLeftY: -0.4, browOuterRightY: -0.4,
    mouthCornerLeftY: -0.5, mouthCornerRightY: -0.5, gazeY: 0.8, headPitch: 9
  },
  reluctant_respect: {
    leftEyelidUpper: 0.18, rightEyelidUpper: 0.18,
    browInnerLeftY: 0.4, browInnerRightY: 0.4, mouthCornerLeftY: 0.25, mouthCornerRightY: 0.15,
    headPitch: 7, headRoll: 2
  },
  fear_concern: {
    leftEyelidUpper: 0.0, rightEyelidUpper: 0.0,
    browInnerLeftY: 0.9, browInnerRightY: 0.9, browOuterLeftY: -0.3, browOuterRightY: -0.3,
    mouthCornerLeftY: -0.4, mouthCornerRightY: -0.4, jawOpen: 0.25, torsoLeanY: 5
  },
  victory: {
    leftEyelidUpper: 0.12, rightEyelidUpper: 0.12,
    browInnerLeftY: 0.3, browInnerRightY: 0.3,
    mouthCornerLeftY: 0.85, mouthCornerRightY: 0.85, jawOpen: 0.35, headPitch: -6, torsoLeanY: -3
  },
  defeat: {
    leftEyelidUpper: 0.72, rightEyelidUpper: 0.72,
    browInnerLeftY: 0.5, browInnerRightY: 0.5, browOuterLeftY: -0.5, browOuterRightY: -0.5,
    mouthCornerLeftY: -0.65, mouthCornerRightY: -0.65, gazeY: 0.9, headPitch: 12, torsoLeanY: 6
  },
  exhaustion: {
    leftEyelidUpper: 0.65, rightEyelidUpper: 0.65,
    browInnerLeftY: 0.2, browInnerRightY: 0.2, jawOpen: 0.15, headPitch: 10, headRoll: -5
  },
};

export interface BossVisualArchetype {
  skinTone: string;
  skinMid: string;
  skinShadow: string;
  eyeSclera: string;
  irisColor: string;
  pupilShape: 'round' | 'slit' | 'void_ring';
  hairColor: string;
  armorPrimary: string;
  armorSecondary: string;
  cloakColor: string;
  crownType: 'imperial' | 'elven' | 'dwarven' | 'orc_horns' | 'dragon_horns' | 'vampire_collar' | 'celestial_halo' | 'nordic_helm' | 'sultan_turban' | 'void_crown';
  facialHair: 'royal_beard' | 'none' | 'braided_beard' | 'tusks' | 'scales' | 'nordic_beard' | 'goatee';
  hasScars?: boolean;
  hasPointedEars?: boolean;
  breathSpeed: number;
}

const ARCHETYPES: Record<string, BossVisualArchetype> = {
  eternal_crown: {
    skinTone: '#dfa985', skinMid: '#c48660', skinShadow: '#8c5538', eyeSclera: '#f4efe6', irisColor: '#3d6b88',
    pupilShape: 'round', hairColor: '#d9d9d9', armorPrimary: '#d4af37', armorSecondary: '#3b2b18', cloakColor: '#7a1218',
    crownType: 'imperial', facialHair: 'royal_beard', breathSpeed: 1.8
  },
  elven_throne: {
    skinTone: '#efe8fa', skinMid: '#d5c6eb', skinShadow: '#9d87bf', eyeSclera: '#e0fbfc', irisColor: '#00f5d4',
    pupilShape: 'round', hairColor: '#e2eafc', armorPrimary: '#c0c8d8', armorSecondary: '#1b4332', cloakColor: '#0f4c3a',
    crownType: 'elven', facialHair: 'none', hasPointedEars: true, breathSpeed: 1.4
  },
  iron_bastion: {
    skinTone: '#d1915c', skinMid: '#b06d3b', skinShadow: '#78441e', eyeSclera: '#f2e9e4', irisColor: '#f59e0b',
    pupilShape: 'round', hairColor: '#9c4221', armorPrimary: '#cd7f32', armorSecondary: '#27272a', cloakColor: '#451a03',
    crownType: 'dwarven', facialHair: 'braided_beard', hasScars: true, breathSpeed: 2.3
  },
  ash_throne: {
    skinTone: '#5a8249', skinMid: '#436436', skinShadow: '#273d1e', eyeSclera: '#fef08a', irisColor: '#ef4444',
    pupilShape: 'slit', hairColor: '#171717', armorPrimary: '#52525b', armorSecondary: '#7f1d1d', cloakColor: '#450a0a',
    crownType: 'orc_horns', facialHair: 'tusks', hasScars: true, breathSpeed: 2.7
  },
  draconic_empire: {
    skinTone: '#a82828', skinMid: '#7d1818', skinShadow: '#470909', eyeSclera: '#1c1917', irisColor: '#ffbe0b',
    pupilShape: 'slit', hairColor: '#1a1a1a', armorPrimary: '#ffd166', armorSecondary: '#141414', cloakColor: '#6a040f',
    crownType: 'dragon_horns', facialHair: 'scales', breathSpeed: 1.5
  },
  shadow_court: {
    skinTone: '#e5e0eb', skinMid: '#c4b8d1', skinShadow: '#847596', eyeSclera: '#f8edeb', irisColor: '#e63946',
    pupilShape: 'round', hairColor: '#10002b', armorPrimary: '#3c0919', armorSecondary: '#adb5bd', cloakColor: '#590d22',
    crownType: 'vampire_collar', facialHair: 'none', hasPointedEars: true, breathSpeed: 1.1
  },
  celestial_sanctuary: {
    skinTone: '#fefae0', skinMid: '#ebdcad', skinShadow: '#bfa86f', eyeSclera: '#ffffff', irisColor: '#4cc9f0',
    pupilShape: 'round', hairColor: '#fff3b0', armorPrimary: '#ffd166', armorSecondary: '#f8f9fa', cloakColor: '#48cae4',
    crownType: 'celestial_halo', facialHair: 'none', breathSpeed: 1.2
  },
  snow_dominion: {
    skinTone: '#e6ccb2', skinMid: '#c7a27c', skinShadow: '#8f6845', eyeSclera: '#f1faee', irisColor: '#48cae4',
    pupilShape: 'round', hairColor: '#e5e5e5', armorPrimary: '#6c757d', armorSecondary: '#293241', cloakColor: '#343a40',
    crownType: 'nordic_helm', facialHair: 'nordic_beard', hasScars: true, breathSpeed: 2.0
  },
  sand_kingdom: {
    skinTone: '#c28b5e', skinMid: '#9e6b40', skinShadow: '#6e4523', eyeSclera: '#faedcd', irisColor: '#00b4d8',
    pupilShape: 'round', hairColor: '#1c1917', armorPrimary: '#f4d35e', armorSecondary: '#0d3b66', cloakColor: '#1d3557',
    crownType: 'sultan_turban', facialHair: 'goatee', breathSpeed: 1.6
  },
  void_throne: {
    skinTone: '#480ca8', skinMid: '#3a0ca3', skinShadow: '#10002b', eyeSclera: '#03045e', irisColor: '#00f5d4',
    pupilShape: 'void_ring', hairColor: '#7209b7', armorPrimary: '#240046', armorSecondary: '#00f5d4', cloakColor: '#05050a',
    crownType: 'void_crown', facialHair: 'none', breathSpeed: 0.9
  },
};

export class RivalAvatar2D {
  private container: HTMLElement | null;
  private currentRealmId = 'eternal_crown';
  private currentChannels: FacialRigChannels = { ...DEFAULT_CHANNELS };
  private targetChannels: FacialRigChannels = { ...DEFAULT_CHANNELS };

  private isBlinking = false;
  private isSlammingArmrest = false;
  private slamProgress = 0;
  private vocalPulseActive = false;
  private vocalEndTime = 0;

  private rafId: number | null = null;
  private blinkTimeoutId: number | null = null;
  private lastTick = performance.now();

  public onArmrestImpact?: () => void;

  constructor(containerSelector: string) {
    this.container = typeof document !== 'undefined' ? document.querySelector(containerSelector) : null;
    this.startAnimationLoop();
    this.scheduleNextNaturalBlink();
  }

  public static generateMiniPortraitSVG(realmId: string): string {
    const a = ARCHETYPES[realmId] || ARCHETYPES.eternal_crown;
    return `
      <svg viewBox="115 38 190 215" class="boss-mini-svg">
        <defs>
          <radialGradient id="mini_bg_${realmId}" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stop-color="${a.armorPrimary}" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#07050a" stop-opacity="0.98"/>
          </radialGradient>
          <linearGradient id="skinGrad_${realmId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${a.skinTone}"/>
            <stop offset="60%" stop-color="${a.skinMid}"/>
            <stop offset="100%" stop-color="${a.skinShadow}"/>
          </linearGradient>
        </defs>
        <rect x="115" y="38" width="190" height="215" rx="6" fill="url(#mini_bg_${realmId})"/>
        ${RivalAvatar2D.buildRiggedLayersSVG(realmId, a, false)}
      </svg>
    `;
  }

  public renderBossForRealm(realm: RealmConfig): void {
    if (!this.container) return;
    this.currentRealmId = realm.id;
    const a = ARCHETYPES[realm.id] || ARCHETYPES.eternal_crown;

    this.container.innerHTML = `
      <div class="boss-stage-wrapper" data-realm="${realm.id}">
        <svg viewBox="0 0 420 450" class="boss-full-svg" aria-label="${realm.rivalName}">
          <defs>
            <linearGradient id="throneGrad_${realm.id}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="${a.armorPrimary}"/>
              <stop offset="50%" stop-color="${a.armorSecondary}"/>
              <stop offset="100%" stop-color="#0b090e"/>
            </linearGradient>
            <linearGradient id="skinGrad_${realm.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${a.skinTone}"/>
              <stop offset="55%" stop-color="${a.skinMid}"/>
              <stop offset="100%" stop-color="${a.skinShadow}"/>
            </linearGradient>
            <radialGradient id="rimLight_${realm.id}" cx="50%" cy="30%" r="55%">
              <stop offset="0%" stop-color="${a.irisColor}" stop-opacity="0.28"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- Halo de Contraluz para Separar la Silueta del Fondo -->
          <circle cx="210" cy="195" r="175" fill="url(#rimLight_${realm.id})"/>

          <!-- 1. Trono Monumental Detrás del Gobernante -->
          <g class="rig-throne-back">
            <path d="M68,440 L88,45 L210,8 L332,45 L352,440 Z" fill="#120f17" stroke="url(#throneGrad_${realm.id})" stroke-width="5"/>
            <path d="M104,420 L118,75 L210,42 L302,75 L316,420 Z" fill="${a.cloakColor}" opacity="0.5"/>
            <!-- Apoyabrazos del Trono -->
            <rect x="42" y="395" width="76" height="28" rx="6" fill="url(#throneGrad_${realm.id})" stroke="#09070c" stroke-width="2"/>
            <rect x="302" y="395" width="76" height="28" rx="6" fill="url(#throneGrad_${realm.id})" stroke="#09070c" stroke-width="2"/>
          </g>

          ${RivalAvatar2D.buildRiggedLayersSVG(realm.id, a, true)}
        </svg>
      </div>
    `;

    this.applyPreset('neutral_attentive');
  }

  private static buildRiggedLayersSVG(realmId: string, a: BossVisualArchetype, includeArms: boolean): string {
    const pupilMarkup =
      a.pupilShape === 'slit'
        ? `<ellipse cx="0" cy="0" rx="1.8" ry="5.5" fill="#050505"/>`
        : a.pupilShape === 'void_ring'
        ? `<circle cx="0" cy="0" r="4.2" fill="none" stroke="#ffffff" stroke-width="1.8"/>`
        : `<circle cx="0" cy="0" r="3.0" fill="#050505"/>`;

    return `
      <g class="rig-torso-group">
        <!-- Manto Real, Hombreras y Armadura Pectoral -->
        <path d="M58,440 C68,295 112,246 210,246 C308,246 352,295 362,440 Z" fill="${a.cloakColor}" stroke="${a.armorPrimary}" stroke-width="3.2"/>
        <path d="M110,272 L210,375 L310,272 L332,440 L88,440 Z" fill="${a.armorSecondary}" stroke="${a.armorPrimary}" stroke-width="2.5"/>
        <path d="M148,268 L210,348 L272,268" fill="none" stroke="${a.armorPrimary}" stroke-width="4.5"/>
        <polygon points="210,302 226,324 210,346 194,324" fill="${a.irisColor}" stroke="${a.armorPrimary}" stroke-width="2.2"/>

        <!-- Hombreras con Relieve -->
        <g class="rig-shoulders">
          <ellipse cx="98" cy="292" rx="46" ry="28" transform="rotate(-16 98 292)" fill="url(#throneGrad_${realmId})" stroke="${a.armorPrimary}" stroke-width="2.2"/>
          <ellipse cx="322" cy="292" rx="46" ry="28" transform="rotate(16 322 292)" fill="url(#throneGrad_${realmId})" stroke="${a.armorPrimary}" stroke-width="2.2"/>
        </g>

        <!-- Cuello Anatómico con Sombras -->
        <rect x="180" y="208" width="60" height="65" rx="16" fill="${a.skinShadow}"/>
        <path d="M190,218 L196,262 M230,218 L224,262" stroke="${a.skinMid}" stroke-width="3" opacity="0.6"/>

        <!-- CABEZA Y RIG FACIAL COMPLETO -->
        <g class="rig-head-group">
          ${
            a.hasPointedEars
              ? `<polygon points="145,165 96,136 142,198" fill="url(#skinGrad_${realmId})" stroke="${a.skinShadow}" stroke-width="2"/>
                 <polygon points="275,165 324,136 278,198" fill="url(#skinGrad_${realmId})" stroke="${a.skinShadow}" stroke-width="2"/>`
              : `<ellipse cx="143" cy="175" rx="11" ry="21" fill="${a.skinShadow}"/>
                 <ellipse cx="277" cy="175" rx="11" ry="21" fill="${a.skinShadow}"/>`
          }

          <!-- Estructura Craneal y Pómulos -->
          <path d="M146,114 C146,72 274,72 274,114 L270,194 C270,234 236,254 210,256 C184,254 150,234 150,194 Z" fill="url(#skinGrad_${realmId})" stroke="${a.skinShadow}" stroke-width="2.2"/>

          <!-- Pliegues Nasolabiales y Arrugas de Carácter -->
          <path d="M160,184 Q174,204 186,196 M260,184 Q246,204 234,196" fill="none" stroke="${a.skinShadow}" stroke-width="2.2" opacity="0.7"/>
          <path d="M182,126 Q210,132 238,126" fill="none" stroke="${a.skinShadow}" stroke-width="1.6" opacity="0.55"/>
          ${
            a.hasScars
              ? `<path d="M164,128 L190,192 M160,145 L178,142" stroke="#541212" stroke-width="2.8" stroke-linecap="round" opacity="0.85"/>`
              : ''
          }

          <!-- OJO IZQUIERDO (Esclerótica, Iris, Pupila, Brillo Especular y Párpados Superior/Inferior) -->
          <g class="rig-eye-left">
            <path d="M164,158 Q182,146 200,158 Q182,168 164,158 Z" fill="${a.eyeSclera}" stroke="#171210" stroke-width="1.8"/>
            <g class="rig-gaze-left" transform="translate(182, 157)">
              <circle cx="0" cy="0" r="6.2" fill="${a.irisColor}"/>
              ${pupilMarkup}
              <circle cx="-2.2" cy="-2.2" r="1.6" fill="#ffffff"/>
            </g>
            <path class="rig-lid-upper-left" d="M162,146 L202,146 L202,158 Q182,158 162,158 Z" fill="${a.skinMid}" stroke="#241712" stroke-width="1.4"/>
            <path class="rig-lid-lower-left" d="M162,169 L202,169 L202,160 Q182,160 162,160 Z" fill="${a.skinShadow}" opacity="0.85"/>
          </g>

          <!-- OJO DERECHO -->
          <g class="rig-eye-right">
            <path d="M220,158 Q238,146 256,158 Q238,168 220,158 Z" fill="${a.eyeSclera}" stroke="#171210" stroke-width="1.8"/>
            <g class="rig-gaze-right" transform="translate(238, 157)">
              <circle cx="0" cy="0" r="6.2" fill="${a.irisColor}"/>
              ${pupilMarkup}
              <circle cx="-2.2" cy="-2.2" r="1.6" fill="#ffffff"/>
            </g>
            <path class="rig-lid-upper-right" d="M218,146 L258,146 L258,158 Q238,158 218,158 Z" fill="${a.skinMid}" stroke="#241712" stroke-width="1.4"/>
            <path class="rig-lid-lower-right" d="M218,169 L258,169 L258,160 Q238,160 218,160 Z" fill="${a.skinShadow}" opacity="0.85"/>
          </g>

          <!-- CEJAS PARAMÉTRICAS -->
          <path class="rig-brow-left" d="M160,144 Q181,137 202,145" fill="none" stroke="${a.hairColor}" stroke-width="5" stroke-linecap="round"/>
          <path class="rig-brow-right" d="M218,145 Q239,137 260,144" fill="none" stroke="${a.hairColor}" stroke-width="5" stroke-linecap="round"/>

          <!-- PUENTE NASAL Y SOMBRA -->
          <path d="M210,148 L203,186 L217,189" fill="none" stroke="${a.skinShadow}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <polygon points="203,186 210,193 219,188" fill="${a.skinShadow}" opacity="0.7"/>

          <!-- MANDÍBULA INFERIOR, BOCA PARAMÉTRICA Y BARBA SECUNDARIA -->
          <g class="rig-jaw-group">
            <path class="rig-mouth-cavity" d="M190,212 Q210,214 230,212 Q210,214 190,212 Z" fill="#290808" stroke="#381812" stroke-width="2.4" stroke-linecap="round"/>
            <g class="rig-beard-sway">
              ${RivalAvatar2D.buildFacialHairSVG(a)}
            </g>
          </g>

          <!-- CABELLO, CORONAS, CUERNOS Y TOCADOS -->
          ${RivalAvatar2D.buildCrownAndHairSVG(a)}
        </g>

        ${
          includeArms
            ? `
          <!-- BRAZOS ANATÓMICOS CONECTADOS AL TORSO Y AL APOYABRAZOS -->
          <g class="rig-arms-layer">
            <g class="rig-arm-left">
              <path d="M84,308 L64,398 L112,406" fill="none" stroke="${a.armorSecondary}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="116" cy="406" r="15" fill="${a.skinTone}" stroke="${a.armorPrimary}" stroke-width="3"/>
            </g>
            <g class="rig-arm-right">
              <path class="rig-arm-right-limb" d="M336,308 L356,398 L308,406" fill="none" stroke="${a.armorSecondary}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
              <circle class="rig-arm-right-fist" cx="304" cy="406" r="16" fill="${a.skinTone}" stroke="${a.armorPrimary}" stroke-width="3.5"/>
            </g>
          </g>
        `
            : ''
        }
      </g>
    `;
  }

  private static buildFacialHairSVG(a: BossVisualArchetype): string {
    switch (a.facialHair) {
      case 'royal_beard':
        return `<path d="M152,194 Q180,226 210,226 Q240,226 268,194 L256,264 Q210,292 164,264 Z" fill="${a.hairColor}" stroke="#8c8c8c" stroke-width="1.6"/>
                <path d="M182,205 Q210,195 238,205" fill="none" stroke="${a.hairColor}" stroke-width="6.5" stroke-linecap="round"/>`;
      case 'braided_beard':
        return `<path d="M148,192 L142,302 L184,328 L210,338 L236,328 L278,302 L272,192 Q210,228 148,192 Z" fill="${a.hairColor}" stroke="#4a1d09" stroke-width="2.2"/>
                <rect x="196" y="268" width="28" height="11" rx="2" fill="${a.armorPrimary}"/>
                <rect x="196" y="302" width="28" height="11" rx="2" fill="${a.armorPrimary}"/>`;
      case 'tusks':
        return `<polygon points="182,216 175,189 193,212" fill="#f5ebe0" stroke="#1c1917" stroke-width="1.8"/>
                <polygon points="238,216 245,189 227,212" fill="#f5ebe0" stroke="#1c1917" stroke-width="1.8"/>`;
      case 'scales':
        return `<path d="M158,195 L172,225 L160,240 M262,195 L248,225 L260,240" fill="none" stroke="${a.armorPrimary}" stroke-width="2" opacity="0.75"/>`;
      case 'nordic_beard':
        return `<path d="M152,195 L160,278 L210,298 L260,278 L268,195 Q210,222 152,195 Z" fill="${a.hairColor}" stroke="#adb5bd" stroke-width="1.5"/>`;
      case 'goatee':
        return `<path d="M190,218 L210,260 L230,218 L220,236 L200,236 Z" fill="${a.hairColor}"/>
                <path d="M182,205 Q210,196 238,205" fill="none" stroke="${a.hairColor}" stroke-width="5" stroke-linecap="round"/>`;
      default:
        return '';
    }
  }

  private static buildCrownAndHairSVG(a: BossVisualArchetype): string {
    switch (a.crownType) {
      case 'imperial':
        return `<path d="M142,135 Q136,84 210,84 Q284,84 278,135" fill="none" stroke="${a.hairColor}" stroke-width="15"/>
                <polygon points="142,112 156,62 184,94 210,48 236,94 264,62 278,112" fill="${a.armorPrimary}" stroke="#5c4308" stroke-width="2.5"/>
                <circle cx="210" cy="86" r="6.5" fill="#e63946"/><circle cx="172" cy="94" r="4.5" fill="#3b82f6"/><circle cx="248" cy="94" r="4.5" fill="#3b82f6"/>`;
      case 'elven':
        return `<path d="M145,115 Q122,215 132,320 M275,115 Q298,215 288,320" stroke="${a.hairColor}" stroke-width="16" fill="none"/>
                <path d="M146,112 Q210,72 274,112 Q210,96 146,112 Z" fill="${a.armorPrimary}"/>
                <polygon points="210,62 219,94 210,114 201,94" fill="${a.irisColor}"/>`;
      case 'dwarven':
        return `<path d="M140,118 L150,68 L270,68 L280,118 Z" fill="${a.armorPrimary}" stroke="#1c1917" stroke-width="3"/>
                <rect x="196" y="64" width="28" height="54" fill="${a.armorSecondary}" stroke="${a.armorPrimary}" stroke-width="2"/>`;
      case 'orc_horns':
        return `<path d="M148,108 C100,82 88,42 126,28 C122,64 140,82 166,96 Z" fill="#e5decf" stroke="#1c1917" stroke-width="2.5"/>
                <path d="M272,108 C320,82 332,42 294,28 C298,64 280,82 254,96 Z" fill="#e5decf" stroke="#1c1917" stroke-width="2.5"/>`;
      case 'dragon_horns':
        return `<path d="M154,102 L98,18 L184,88 Z" fill="${a.armorPrimary}" stroke="#6a040f" stroke-width="2.5"/>
                <path d="M266,102 L322,18 L236,88 Z" fill="${a.armorPrimary}" stroke="#6a040f" stroke-width="2.5"/>
                <polygon points="210,50 224,94 196,94" fill="#ffbe0b"/>`;
      case 'vampire_collar':
        return `<path d="M146,120 Q210,62 274,120 L265,80 Q210,52 155,80 Z" fill="${a.hairColor}"/>
                <path d="M112,255 L78,148 L164,225 M308,255 L342,148 L256,225" fill="${a.cloakColor}" stroke="${a.armorSecondary}" stroke-width="2.2"/>`;
      case 'celestial_halo':
        return `<circle cx="210" cy="135" r="96" fill="none" stroke="${a.armorPrimary}" stroke-width="4.5" stroke-dasharray="14 6"/>
                <polygon points="148,108 210,56 272,108" fill="${a.armorPrimary}"/>`;
      case 'nordic_helm':
        return `<path d="M142,122 C142,64 278,64 278,122 Z" fill="${a.armorPrimary}" stroke="#1b263b" stroke-width="3"/>
                <rect x="204" y="80" width="12" height="72" rx="3" fill="${a.armorSecondary}"/>`;
      case 'sultan_turban':
        return `<ellipse cx="210" cy="90" rx="76" ry="46" fill="${a.cloakColor}" stroke="${a.armorPrimary}" stroke-width="3"/>
                <polygon points="210,54 224,84 210,106 196,84" fill="${a.irisColor}" stroke="${a.armorPrimary}" stroke-width="2"/>`;
      case 'void_crown':
        return `<polygon points="136,95 162,28 210,72 258,28 284,95 210,62" fill="${a.armorSecondary}" opacity="0.9"/>
                <circle cx="210" cy="42" r="11" fill="${a.irisColor}"/>`;
    }
  }

  /**
   * Maps high-level game animation states to detailed 19-expression presets
   * and triggers context-specific physical gestures (such as the armrest slam on Check).
   */
  public setAnimationState(state: CharacterAnimationState): void {
    const stateToPreset: Record<CharacterAnimationState, ExpressionPresetName> = {
      Idle: 'neutral_attentive',
      Thinking: 'focused_calculation',
      DeepThinking: 'suspicion',
      Confident: 'arrogant_smirk',
      Curious: 'mild_amusement',
      Surprised: 'surprise',
      Capture: 'confident_grin',
      PieceLost: 'irritation',
      Check: 'open_anger',
      Checkmate: 'intense_fury',
      Victory: 'victory',
      Defeat: 'defeat',
      Blunder: 'disappointment',
      BrilliantMove: 'reluctant_respect',
      Taunt: 'arrogant_smirk',
      Respect: 'reluctant_respect',
      Annoyed: 'suppressed_anger',
      Laugh: 'confident_grin',
    };

    this.applyPreset(stateToPreset[state] || 'neutral_attentive');

    if (state === 'Check' || state === 'Checkmate') {
      this.strikeArmrest();
    }
  }

  public applyPreset(presetName: ExpressionPresetName): void {
    const preset = EXPRESSION_PRESETS[presetName] || EXPRESSION_PRESETS.neutral_attentive;
    this.targetChannels = {
      ...DEFAULT_CHANNELS,
      ...preset,
    };
  }

  /**
   * Directs the ruler's eyes and head pitch/yaw toward a specific algebraic square ('a1'..'h8')
   * on the 3D chessboard.
   */
  public lookAtBoardSquare(square: string): void {
    if (!square || square.length < 2) return;
    const fileIndex = square.charCodeAt(0) - 97; // 0 (a) to 7 (h)
    const rankIndex = parseInt(square[1], 10) - 1; // 0 (rank 1, near player) to 7 (rank 8, near rival)

    const normX = (fileIndex - 3.5) / 3.5; // -1 to +1
    const normY = 0.25 + ((7 - rankIndex) / 7) * 0.65; // Looking down at board

    this.targetChannels.gazeX = normX * 0.85;
    this.targetChannels.gazeY = normY;
    this.targetChannels.headYaw = normX * 8.0;
    this.targetChannels.headPitch = 3.0 + normY * 6.5;
  }

  public triggerSpeechVocalization(durationMs = 1800): void {
    this.vocalPulseActive = true;
    this.vocalEndTime = performance.now() + durationMs;
  }

  /**
   * Executes an anticipation -> downward strike -> impact recovery sequence
   * with the ruler's right arm and fist against the throne's armrest.
   */
  public strikeArmrest(): void {
    if (this.isSlammingArmrest) return;
    this.isSlammingArmrest = true;
    this.slamProgress = 0;
  }

  private scheduleNextNaturalBlink(): void {
    if (typeof window === 'undefined') return;
    const interval = 2100 + Math.random() * 3800;
    this.blinkTimeoutId = window.setTimeout(() => {
      this.isBlinking = true;
      window.setTimeout(() => {
        this.isBlinking = false;
        this.scheduleNextNaturalBlink();
      }, 135);
    }, interval);
  }

  private startAnimationLoop(): void {
    if (typeof window === 'undefined') return;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - this.lastTick) / 1000);
      this.lastTick = now;
      this.updateRigFrame(now, dt);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private updateRigFrame(now: number, dt: number): void {
    if (!this.container) return;

    const smoothSpeed = 8.5 * dt;
    const c = this.currentChannels;
    const t = this.targetChannels;

    // 1. Interpolate all 22 facial and postural channels smoothly
    (Object.keys(DEFAULT_CHANNELS) as (keyof FacialRigChannels)[]).forEach((key) => {
      c[key] += (t[key] - c[key]) * smoothSpeed;
    });

    const archetype = ARCHETYPES[this.currentRealmId] || ARCHETYPES.eternal_crown;
    const breathPhase = Math.sin((now / 1000) * archetype.breathSpeed);

    // 2. Apply Eyelids (combining expression squint + natural blink)
    const leftLidClose = this.isBlinking ? 0.98 : c.leftEyelidUpper;
    const rightLidClose = this.isBlinking ? 0.98 : c.rightEyelidUpper;

    const lidUL = this.container.querySelector('.rig-lid-upper-left') as SVGPathElement | null;
    const lidUR = this.container.querySelector('.rig-lid-upper-right') as SVGPathElement | null;
    const lidLL = this.container.querySelector('.rig-lid-lower-left') as SVGPathElement | null;
    const lidLR = this.container.querySelector('.rig-lid-lower-right') as SVGPathElement | null;

    if (lidUL) lidUL.setAttribute('d', `M162,146 L202,146 L202,${148 + leftLidClose * 16} Q182,${149 + leftLidClose * 17} 162,${148 + leftLidClose * 16} Z`);
    if (lidUR) lidUR.setAttribute('d', `M218,146 L258,146 L258,${148 + rightLidClose * 16} Q238,${149 + rightLidClose * 17} 218,${148 + rightLidClose * 16} Z`);
    if (lidLL) lidLL.setAttribute('d', `M162,169 L202,169 L202,${166 - c.eyelidLowerSquint * 6} Q182,${166 - c.eyelidLowerSquint * 6} 162,${166 - c.eyelidLowerSquint * 6} Z`);
    if (lidLR) lidLR.setAttribute('d', `M218,169 L258,169 L258,${166 - c.eyelidLowerSquint * 6} Q238,${166 - c.eyelidLowerSquint * 6} 218,${166 - c.eyelidLowerSquint * 6} Z`);

    // 3. Apply Eye Gaze Direction
    const gazeL = this.container.querySelector('.rig-gaze-left') as SVGGElement | null;
    const gazeR = this.container.querySelector('.rig-gaze-right') as SVGGElement | null;
    const gx = c.gazeX * 5.2;
    const gy = c.gazeY * 4.2;
    if (gazeL) gazeL.setAttribute('transform', `translate(${182 + gx}, ${157 + gy})`);
    if (gazeR) gazeR.setAttribute('transform', `translate(${238 + gx}, ${157 + gy})`);

    // 4. Apply Parametric Brows
    const browL = this.container.querySelector('.rig-brow-left') as SVGPathElement | null;
    const browR = this.container.querySelector('.rig-brow-right') as SVGPathElement | null;
    if (browL) {
      const outY = 144 - c.browOuterLeftY * 8;
      const inY = 145 - c.browInnerLeftY * 9;
      const midY = (outY + inY) * 0.5 - 6;
      browL.setAttribute('d', `M160,${outY} Q181,${midY} 202,${inY}`);
    }
    if (browR) {
      const inY = 145 - c.browInnerRightY * 9;
      const outY = 144 - c.browOuterRightY * 8;
      const midY = (outY + inY) * 0.5 - 6;
      browR.setAttribute('d', `M218,${inY} Q239,${midY} 260,${outY}`);
    }

    // 5. Apply Parametric Mouth & Speech Jaw Articulation
    let jaw = c.jawOpen;
    if (this.vocalPulseActive) {
      if (now < this.vocalEndTime) {
        jaw = Math.max(jaw, 0.15 + Math.abs(Math.sin(now * 0.022)) * 0.38);
      } else {
        this.vocalPulseActive = false;
      }
    }

    const mouth = this.container.querySelector('.rig-mouth-cavity') as SVGPathElement | null;
    if (mouth) {
      const leftCornerY = 212 - c.mouthCornerLeftY * 8;
      const rightCornerY = 212 - c.mouthCornerRightY * 8;
      const upperMidY = 211 - (c.mouthCornerLeftY + c.mouthCornerRightY) * 1.5;
      const lowerMidY = upperMidY + 2 + jaw * 16;
      mouth.setAttribute(
        'd',
        `M190,${leftCornerY} Q210,${upperMidY} 230,${rightCornerY} Q210,${lowerMidY} 190,${leftCornerY} Z`
      );
    }

    // 6. Head Turn, Breathing & Secondary Beard Motion
    const headGroup = this.container.querySelector('.rig-head-group') as SVGGElement | null;
    if (headGroup) {
      const tx = c.headYaw * 0.6;
      const ty = c.headPitch * 0.55 + breathPhase * 1.8;
      headGroup.setAttribute('transform', `translate(${tx}, ${ty}) rotate(${c.headRoll}, 210, 185)`);
    }

    const beardGroup = this.container.querySelector('.rig-beard-sway') as SVGGElement | null;
    if (beardGroup) {
      beardGroup.setAttribute('transform', `translate(0, ${jaw * 4.5}) rotate(${Math.sin(now * 0.002) * 1.2}, 210, 215)`);
    }

    // 7. Right Arm Gesture & Armrest Slam Kinematics
    const rightLimb = this.container.querySelector('.rig-arm-right-limb') as SVGPathElement | null;
    const rightFist = this.container.querySelector('.rig-arm-right-fist') as SVGCircleElement | null;
    if (rightLimb && rightFist) {
      let fistX = 304 - c.rightArmElevation * 58;
      let fistY = 406 - c.rightArmElevation * 135;

      if (this.isSlammingArmrest) {
        const prevProgress = this.slamProgress;
        this.slamProgress += dt * 2.2;
        if (this.slamProgress < 0.45) {
          // Anticipation: Raise fist high above throne armrest
          const lift = this.slamProgress / 0.45;
          fistY = 406 - lift * 95;
          fistX = 316;
        } else if (this.slamProgress < 0.65) {
          // Downward strike onto armrest
          const strike = (this.slamProgress - 0.45) / 0.2;
          fistY = 311 + strike * 102;
          fistX = 316;
          if (prevProgress < 0.62 && this.slamProgress >= 0.62) {
            this.onArmrestImpact?.();
          }
        } else if (this.slamProgress < 1.0) {
          // Follow-through & recovery
          fistY = 406;
        } else {
          this.isSlammingArmrest = false;
        }
      }

      rightLimb.setAttribute('d', `M336,308 L356,385 L${fistX},${fistY}`);
      rightFist.setAttribute('cx', String(fistX));
      rightFist.setAttribute('cy', String(fistY));
    }
  }

  public dispose(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.blinkTimeoutId) clearTimeout(this.blinkTimeoutId);
  }
}
