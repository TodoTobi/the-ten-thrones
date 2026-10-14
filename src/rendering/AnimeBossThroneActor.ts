// src/rendering/AnimeBossThroneActor.ts
import * as THREE from 'three';
import { CharacterAnimationState, RealmConfig } from '../core/types';
import { PostProcessingPipeline } from './PostProcessingPipeline';

export interface AnimeBossStyle {
  skinBase: string;
  skinCelShadow: string;
  skinDeepShadow: string;
  hairColor: string;
  hairHighlight: string;
  eyeColor: string;
  eyeGlow: boolean;
  armorColor: string;
  armorTrim: string;
  capeColor: string;
  feature: 'king_beard' | 'elf_tiara' | 'dwarf_braids' | 'orc_tusks' | 'dragon_horns' | 'vampire_collar' | 'angel_halo' | 'viking_furs' | 'sultan_gold' | 'void_mask';
}

export const ANIME_BOSS_STYLES: Record<string, AnimeBossStyle> = {
  eternal_crown: {
    skinBase: '#e8c3a9', skinCelShadow: '#b88668', skinDeepShadow: '#6e452e',
    hairColor: '#d4d8e0', hairHighlight: '#ffffff', eyeColor: '#38bdf8', eyeGlow: false,
    armorColor: '#27232a', armorTrim: '#eab308', capeColor: '#7f1d1d', feature: 'king_beard'
  },
  elven_throne: {
    skinBase: '#f3e8ff', skinCelShadow: '#c084fc', skinDeepShadow: '#581c87',
    hairColor: '#e0f2fe', hairHighlight: '#ffffff', eyeColor: '#2dd4bf', eyeGlow: true,
    armorColor: '#064e3b', armorTrim: '#a7f3d0', capeColor: '#115e59', feature: 'elf_tiara'
  },
  iron_bastion: {
    skinBase: '#d69e72', skinCelShadow: '#9a5b32', skinDeepShadow: '#451a03',
    hairColor: '#9a3412', hairHighlight: '#fdba74', eyeColor: '#f59e0b', eyeGlow: false,
    armorColor: '#27272a', armorTrim: '#d97706', capeColor: '#451a03', feature: 'dwarf_braids'
  },
  ash_throne: {
    skinBase: '#5c7c4e', skinCelShadow: '#364f2b', skinDeepShadow: '#14240e',
    hairColor: '#09090b', hairHighlight: '#52525b', eyeColor: '#ef4444', eyeGlow: true,
    armorColor: '#18181b', armorTrim: '#dc2626', capeColor: '#450a0a', feature: 'orc_tusks'
  },
  draconic_empire: {
    skinBase: '#c29b82', skinCelShadow: '#7c2d12', skinDeepShadow: '#431407',
    hairColor: '#18181b', hairHighlight: '#f97316', eyeColor: '#facc15', eyeGlow: true,
    armorColor: '#09090b', armorTrim: '#f59e0b', capeColor: '#7c2d12', feature: 'dragon_horns'
  },
  shadow_court: {
    skinBase: '#f1f5f9', skinCelShadow: '#94a3b8', skinDeepShadow: '#334155',
    hairColor: '#0f172a', hairHighlight: '#64748b', eyeColor: '#e11d48', eyeGlow: true,
    armorColor: '#09090b', armorTrim: '#cbd5e1', capeColor: '#4c0519', feature: 'vampire_collar'
  },
  celestial_sanctuary: {
    skinBase: '#fef3c7', skinCelShadow: '#d97706', skinDeepShadow: '#78350f',
    hairColor: '#fef08a', hairHighlight: '#ffffff', eyeColor: '#38bdf8', eyeGlow: true,
    armorColor: '#f8fafc', armorTrim: '#fbbf24', capeColor: '#0284c7', feature: 'angel_halo'
  },
  snow_dominion: {
    skinBase: '#e2ceb9', skinCelShadow: '#9c7a5b', skinDeepShadow: '#4a3525',
    hairColor: '#cbd5e1', hairHighlight: '#f8fafc', eyeColor: '#38bdf8', eyeGlow: false,
    armorColor: '#1e293b', armorTrim: '#94a3b8', capeColor: '#0f172a', feature: 'viking_furs'
  },
  sand_kingdom: {
    skinBase: '#b87d52', skinCelShadow: '#7c4722', skinDeepShadow: '#3b1d08',
    hairColor: '#09090b', hairHighlight: '#475569', eyeColor: '#06b6d4', eyeGlow: false,
    armorColor: '#1e1b4b', armorTrim: '#fbbf24', capeColor: '#0f172a', feature: 'sultan_gold'
  },
  void_throne: {
    skinBase: '#c4b5fd', skinCelShadow: '#5b21b6', skinDeepShadow: '#1e1b4b',
    hairColor: '#2e1065', hairHighlight: '#22d3ee', eyeColor: '#00f5d4', eyeGlow: true,
    armorColor: '#090514', armorTrim: '#00f5d4', capeColor: '#1e1b4b', feature: 'void_mask'
  },
};

export class AnimeBossThroneActor {
  private group = new THREE.Group();
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private planeMesh: THREE.Mesh;
  private commandSigilRing: THREE.Mesh;

  private currentRealm!: RealmConfig;
  private currentState: CharacterAnimationState = 'Idle';
  private externalSprite: HTMLImageElement | null = null;

  // Parámetros de animación en vivo
  private blinkValue = 0;
  private commandArmRaise = 0; // 0 = apoyado en trono, 1 = dando orden a la mano de títere
  private targetCommandArm = 0;
  private gazeOffset = { x: 0, y: 0 };
  private jawOpen = 0;

  constructor(scene: THREE.Scene) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;

    // Plano 2.5D sentado exactamente dentro del trono 3D (z = -7.6)
    const geo = new THREE.PlaneGeometry(5.6, 5.6);
    const mat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide,
    });

    this.planeMesh = new THREE.Mesh(geo, mat);
    this.planeMesh.position.set(0, 2.75, -7.65);
    this.group.add(this.planeMesh);

    // Sello Arcano que brilla junto a la mano del jefe cuando ordena mover la marioneta
    const sigilGeo = new THREE.RingGeometry(0.35, 0.52, 6);
    const sigilMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.commandSigilRing = new THREE.Mesh(sigilGeo, sigilMat);
    this.commandSigilRing.position.set(1.25, 3.35, -7.2);
    PostProcessingPipeline.markForSelectiveBloom(this.commandSigilRing);
    this.group.add(this.commandSigilRing);

    scene.add(this.group);
  }

  public loadBossForRealm(realm: RealmConfig): void {
    this.currentRealm = realm;
    this.externalSprite = null;

    const sigilMat = this.commandSigilRing.material as THREE.MeshBasicMaterial;
    sigilMat.color.setHex(realm.palette.accent);

    // Si el usuario añade un retrato Anime PNG real en public/assets/bosses/<id>.png, se carga automáticamente
    const img = new Image();
    img.src = `/assets/bosses/${realm.id}.png`;
    img.onload = () => {
      this.externalSprite = img;
    };
  }

  /**
   * Activa la pose de "Orden de Titiritero": el jefe levanta su mano desde el trono
   * e invoca el sello rúnico que controla la mano de títere sobre el tablero.
   */
  public setPuppetCommandGesture(active: boolean): void {
    this.targetCommandArm = active ? 1.0 : 0.0;
  }

  public setAnimationState(state: CharacterAnimationState): void {
    this.currentState = state;
  }

  public setGazeTarget(normX: number, normY: number): void {
    this.gazeOffset.x = THREE.MathUtils.clamp(normX, -1, 1);
    this.gazeOffset.y = THREE.MathUtils.clamp(normY, -1, 1);
  }

  public update(deltaSec: number, elapsedSec: number): void {
    if (!this.currentRealm) return;

    // 1. Interpolación suave del brazo de mando y sello arcano
    this.commandArmRaise += (this.targetCommandArm - this.commandArmRaise) * Math.min(1, deltaSec * 8);
    const sigilMat = this.commandSigilRing.material as THREE.MeshBasicMaterial;
    sigilMat.opacity = this.commandArmRaise * 0.85;
    this.commandSigilRing.rotation.z = elapsedSec * 2.2;
    this.commandSigilRing.scale.setScalar(0.8 + this.commandArmRaise * 0.4);

    // 2. Parpadeo estocástico natural
    const blinkCycle = elapsedSec % 4.3;
    this.blinkValue = blinkCycle > 4.12 ? Math.sin(((blinkCycle - 4.12) / 0.18) * Math.PI) : 0;

    // 3. Respiración sutil del plano 2.5D en el trono
    this.planeMesh.scale.y = 1.0 + Math.sin(elapsedSec * 1.9) * 0.012;

    this.renderAnimeBossCanvas(elapsedSec);
    this.texture.needsUpdate = true;
  }

  /**
   * Genera un retrato 2D en miniatura (DataURL) con estética Anime Seinen
   * para usar en la barra inferior del Selector de Reinos y en el retrato grande.
   */
  public static renderPortraitDataURL(realm: RealmConfig): string {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 512;
    tempCanvas.height = 512;
    const ctx = tempCanvas.getContext('2d')!;
    ctx.scale(0.5, 0.5);
    AnimeBossThroneActor.drawAnimeCharacter(ctx, realm, 'Confident', 0, 0, { x: 0, y: 0 }, 0);
    return tempCanvas.toDataURL();
  }

  private renderAnimeBossCanvas(elapsedSec: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1024, 1024);

    if (this.externalSprite) {
      ctx.drawImage(this.externalSprite, 0, 0, 1024, 1024);
      return;
    }

    AnimeBossThroneActor.drawAnimeCharacter(
      ctx,
      this.currentRealm,
      this.currentState,
      this.blinkValue,
      this.commandArmRaise,
      this.gazeOffset,
      elapsedSec
    );
  }

  /**
   * Ilustrador Cel-Shaded estilo Anime Seinen (trazos negros afilados, sombreado duro de 3 capas,
   * anatomía imponente sentada en el trono y gesto de titiritero).
   */
  public static drawAnimeCharacter(
    ctx: CanvasRenderingContext2D,
    realm: RealmConfig,
    state: CharacterAnimationState,
    blink: number,
    armCommand: number,
    gaze: { x: number; y: number },
    time: number
  ): void {
    const s = ANIME_BOSS_STYLES[realm.id] || ANIME_BOSS_STYLES.eternal_crown;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Aura oscura/mágica de Jefe Final detrás de los hombros
    const auraGrad = ctx.createRadialGradient(512, 460, 60, 512, 460, 420);
    auraGrad.addColorStop(0, `${s.armorTrim}55`);
    auraGrad.addColorStop(0.5, `${s.capeColor}33`);
    auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(512, 460, 420, 0, Math.PI * 2);
    ctx.fill();

    // 1. CAPA IMPERIAL Y HOMBROS ANCHOS (Estilo Anime Seinen)
    ctx.fillStyle = s.capeColor;
    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(150, 980);
    ctx.bezierCurveTo(170, 640, 260, 520, 512, 520);
    ctx.bezierCurveTo(764, 520, 854, 640, 874, 980);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pliegues dramáticos en negro puro (estilo Mignola / Seinen)
    ctx.fillStyle = '#09070c';
    ctx.beginPath();
    ctx.moveTo(310, 610); ctx.lineTo(360, 960); ctx.lineTo(280, 960); ctx.closePath();
    ctx.moveTo(714, 610); ctx.lineTo(664, 960); ctx.lineTo(744, 960); ctx.closePath();
    ctx.fill();

    // 2. TORSO ACORAZADO Y HOMBRERAS MONUMENTALES
    ctx.fillStyle = s.armorColor;
    ctx.beginPath();
    ctx.moveTo(270, 560);
    ctx.lineTo(512, 790);
    ctx.lineTo(754, 560);
    ctx.lineTo(790, 980);
    ctx.lineTo(234, 980);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bordes dorados/metálicos de la coraza
    ctx.strokeStyle = s.armorTrim;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(320, 565); ctx.lineTo(512, 750); ctx.lineTo(704, 565);
    ctx.stroke();

    // Hombreras angulares afiladas
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#09070c';
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(512 + dir * 255, 595);
      ctx.scale(dir, 1);
      ctx.fillStyle = s.armorColor;
      ctx.beginPath();
      ctx.moveTo(-70, -45); ctx.lineTo(95, -20); ctx.lineTo(125, 45); ctx.lineTo(-55, 55); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = s.armorTrim; ctx.lineWidth = 5;
      ctx.strokeRect(-45, -25, 115, 55);
      ctx.restore();
    }

    // 3. CUELLO ANATÓMICO CON SOMBRA DURA PROYECTADA POR LA MANDÍBULA
    ctx.fillStyle = s.skinCelShadow;
    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 6;
    ctx.fillRect(452, 435, 120, 125);
    ctx.strokeRect(452, 435, 120, 125);

    // Sombra triangular profunda bajo el mentón
    ctx.fillStyle = s.skinDeepShadow;
    ctx.beginPath();
    ctx.moveTo(452, 445); ctx.lineTo(572, 445); ctx.lineTo(512, 525); ctx.closePath();
    ctx.fill();

    // 4. ROSTRO ANIME SEINEN (Mandíbula en V afilada, Pómulos marcados, Cel-Shading lateral)
    ctx.fillStyle = s.skinBase;
    ctx.beginPath();
    ctx.moveTo(385, 250);
    ctx.lineTo(392, 385);
    ctx.lineTo(448, 468);
    ctx.lineTo(512, 492); // Mentón afilado
    ctx.lineTo(576, 468);
    ctx.lineTo(632, 385);
    ctx.lineTo(639, 250);
    ctx.quadraticCurveTo(512, 195, 385, 250);
    ctx.closePath();
    ctx.fill();

    // Sombra Cel-Shading en la mitad derecha del rostro para dramatismo
    ctx.fillStyle = s.skinCelShadow;
    ctx.beginPath();
    ctx.moveTo(512, 215);
    ctx.lineTo(522, 375);
    ctx.lineTo(512, 492);
    ctx.lineTo(576, 468);
    ctx.lineTo(632, 385);
    ctx.lineTo(639, 250);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Líneas de pómulos y arrugas severas de veterano
    ctx.strokeStyle = s.skinDeepShadow;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(415, 365); ctx.lineTo(442, 405);
    ctx.moveTo(609, 365); ctx.lineTo(582, 405);
    ctx.moveTo(475, 315); ctx.lineTo(492, 332);
    ctx.moveTo(549, 315); ctx.lineTo(532, 332);
    ctx.stroke();

    // 5. OJOS ESTILO ANIME (Rasgados, Mirada Intimidante, Brillo de Poder)
    const isAngry = state === 'Check' || state === 'PieceLost' || state === 'Checkmate';
    const eyeOpenH = Math.max(2, 22 * (1 - blink));

    for (const dir of [-1, 1]) {
      const ex = 512 + dir * 56;
      const ey = 336;

      // Sombra profunda de la cuenca ocular
      ctx.fillStyle = s.skinDeepShadow;
      ctx.beginPath();
      ctx.ellipse(ex, ey - 4, 34, 16, dir * 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Esclerótica afilada
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#09070c';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(ex - 28, ey);
      ctx.quadraticCurveTo(ex, ey - eyeOpenH, ex + 28, ey - dir * 3);
      ctx.quadraticCurveTo(ex, ey + eyeOpenH * 0.7, ex - 28, ey);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (blink < 0.85) {
        // Iris detallado con pupila contraída de jefe final
        const ix = ex + gaze.x * 8;
        const iy = ey + gaze.y * 5;
        ctx.fillStyle = s.eyeColor;
        ctx.beginPath();
        ctx.arc(ix, iy, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#09070c';
        ctx.beginPath();
        ctx.arc(ix, iy, 4.2, 0, Math.PI * 2);
        ctx.fill();

        // Destello blanco anime
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ix - 3.5, iy - 3.5, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Estela luminosa si está dando una orden de títere o en furia
        if (s.eyeGlow || armCommand > 0.2 || isAngry) {
          ctx.strokeStyle = s.eyeColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ix, iy);
          ctx.lineTo(ix + dir * 26, iy - 14);
          ctx.stroke();
        }
      }

      // Ceja afilada expresiva
      ctx.strokeStyle = '#09070c';
      ctx.fillStyle = s.hairColor;
      ctx.lineWidth = 3;
      const browTilt = isAngry ? 14 : state === 'Surprised' ? -10 : 6;
      ctx.beginPath();
      ctx.moveTo(ex - dir * 32, ey - 18 + browTilt);
      ctx.lineTo(ex + dir * 34, ey - 26 - browTilt * 0.5);
      ctx.lineTo(ex + dir * 30, ey - 16 - browTilt * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 6. NARIZ AFILADA CON SOMBRA LATERAL CEL-SHADED
    ctx.fillStyle = s.skinDeepShadow;
    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(512, 328);
    ctx.lineTo(498, 398);
    ctx.lineTo(516, 404);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 7. BOCA Y EXPRESIÓN DE MANDO / DESPRECIO
    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    if (state === 'Capture' || state === 'Taunt' || state === 'Confident') {
      // Sonrisa asimétrica arrogante de villano de anime
      ctx.moveTo(476, 436);
      ctx.quadraticCurveTo(512, 438, 552, 422);
    } else if (isAngry) {
      // Dientes apretados en furia
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(480, 428, 64, 16);
      ctx.strokeRect(480, 428, 64, 16);
    } else {
      ctx.moveTo(482, 434);
      ctx.lineTo(542, 434);
    }
    ctx.stroke();

    // 8. RASGOS DISTINTIVOS DEL GOBERNANTE (Barba Real Esculpida, Cuernos, Corona, etc.)
    AnimeBossThroneActor.drawBossUniqueFeatures(ctx, s);

    // 9. BRAZOS APOYADOS EN EL TRONO + GESTO DE ORDEN AL TÍTERE
    // Brazo izquierdo firme sobre el reposabrazos izquierdo
    ctx.fillStyle = s.armorColor;
    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(235, 620); ctx.lineTo(175, 860); ctx.lineTo(310, 910); ctx.lineTo(330, 845); ctx.lineTo(255, 815);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Brazo derecho: sube con aura mágica cuando da la orden a la Mano de Títere (armCommand > 0)
    const handX = 725 + armCommand * 45;
    const handY = 885 - armCommand * 360;

    ctx.fillStyle = s.armorColor;
    ctx.beginPath();
    ctx.moveTo(785, 620);
    ctx.lineTo(845, 790 - armCommand * 120);
    ctx.lineTo(handX + 35, handY + 25);
    ctx.lineTo(handX - 25, handY - 25);
    ctx.lineTo(755, 760 - armCommand * 110);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mano enguantada del jefe (con dedos extendidos en pose de titiritero cuando da una orden)
    ctx.fillStyle = s.armorTrim;
    ctx.beginPath();
    ctx.arc(handX, handY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (armCommand > 0.15) {
      // Hilos de energía dorada que suben desde los dedos del jefe hacia el techo del salón
      ctx.strokeStyle = s.armorTrim;
      ctx.lineWidth = 3;
      for (let f = -2; f <= 2; f++) {
        ctx.beginPath();
        ctx.moveTo(handX + f * 10, handY - 20);
        ctx.lineTo(handX + f * 35, 0);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private static drawBossUniqueFeatures(ctx: CanvasRenderingContext2D, s: AnimeBossStyle): void {
    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 5;

    if (s.feature === 'king_beard' || s.feature === 'dwarf_braids' || s.feature === 'viking_furs') {
      // Barba puntiaguda con mechones dinámicos anime
      ctx.fillStyle = s.hairColor;
      ctx.beginPath();
      ctx.moveTo(392, 385);
      ctx.lineTo(445, 455);
      ctx.lineTo(512, 462);
      ctx.lineTo(579, 455);
      ctx.lineTo(632, 385);
      ctx.lineTo(605, 535);
      ctx.lineTo(555, 595);
      ctx.lineTo(512, 635);
      ctx.lineTo(469, 595);
      ctx.lineTo(419, 535);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bigote imperial afilado
      ctx.beginPath();
      ctx.moveTo(512, 408);
      ctx.lineTo(435, 438);
      ctx.lineTo(455, 415);
      ctx.moveTo(512, 408);
      ctx.lineTo(589, 438);
      ctx.lineTo(569, 415);
      ctx.stroke();
    }

    // Cabello con mechones largos laterales y Corona / Cuernos
    ctx.fillStyle = s.hairColor;
    ctx.beginPath();
    ctx.moveTo(375, 275);
    ctx.lineTo(335, 465);
    ctx.lineTo(388, 415);
    ctx.lineTo(395, 240);
    ctx.lineTo(629, 240);
    ctx.lineTo(636, 415);
    ctx.lineTo(689, 465);
    ctx.lineTo(649, 275);
    ctx.quadraticCurveTo(512, 165, 375, 275);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Corona gótica puntiaguda / Cuernos imponentes
    ctx.fillStyle = s.armorTrim;
    ctx.beginPath();
    if (s.feature === 'dragon_horns' || s.feature === 'orc_tusks') {
      ctx.moveTo(395, 225); ctx.lineTo(275, 75); ctx.lineTo(445, 195);
      ctx.moveTo(629, 225); ctx.lineTo(749, 75); ctx.lineTo(579, 195);
    } else {
      ctx.moveTo(380, 235);
      ctx.lineTo(395, 135);
      ctx.lineTo(452, 195);
      ctx.lineTo(512, 95);
      ctx.lineTo(572, 195);
      ctx.lineTo(629, 135);
      ctx.lineTo(644, 235);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
  }
}
