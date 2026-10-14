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

export type PaperPoseName =
  | 'idle'
  | 'thinking'
  | 'calculating'
  | 'taunt'
  | 'surprised'
  | 'irritated'
  | 'fury_slam'
  | 'focus_lean'
  | 'defeat';

export class AnimeBossThroneActor {
  private group = new THREE.Group();
  private planeMesh: THREE.Mesh;
  private shadowMesh: THREE.Mesh;
  private commandSigilRing: THREE.Mesh;

  private currentRealm!: RealmConfig;
  private currentState: CharacterAnimationState = 'Idle';
  private currentPose: PaperPoseName = 'idle';
  private targetPose: PaperPoseName = 'idle';

  // Soporte Paper Mario para los 10 Reinos
  private isPaperMode = true;
  private paperTextureLoader = new THREE.TextureLoader();
  private paperTexturesCache = new Map<string, Map<PaperPoseName, THREE.Texture>>();
  private paperTextures = new Map<PaperPoseName, THREE.Texture>();
  private paperMaterial!: THREE.MeshBasicMaterial;

  // Fallback Canvas para reinos sin sprites Paper Mario
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private canvasTexture: THREE.CanvasTexture;
  private canvasMaterial: THREE.MeshBasicMaterial;

  // Parámetros de animación física estilo Paper Mario
  private baseY = 2.85;
  private baseScaleX = 1.0;
  private baseScaleY = 1.0;
  private flipProgress = 1.0; // 0 a 1 (giro de hoja en eje Y)
  private isFlipping = false;
  private hasSwappedInFlip = false;
  private hopProgress = 1.0; // 0 a 1 (salto elástico en sorpresa)
  private squashOffset = 0; // compresión / estiramiento elástico
  private speechTimer = 0; // segundos restantes de charla vocalizada
  private commandArmRaise = 0;
  private targetCommandArm = 0;
  private blinkValue = 0;
  private gazeOffset = { x: 0, y: 0 };

  public onArmrestImpact?: () => void;

  constructor(scene: THREE.Scene) {
    // 1. Textura Canvas procedural de respaldo
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d')!;

    this.canvasTexture = new THREE.CanvasTexture(this.canvas);
    this.canvasTexture.colorSpace = THREE.SRGBColorSpace;
    this.canvasTexture.minFilter = THREE.LinearFilter;

    this.canvasMaterial = new THREE.MeshBasicMaterial({
      map: this.canvasTexture,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide,
    });

    this.paperMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.02,
      side: THREE.DoubleSide,
    });

    // 2. Geometría del plano 2.5D sentado en el trono 3D (z = -7.65)
    // Proporciones 800:620 optimizadas para los sprites de Paper Mario
    const geo = new THREE.PlaneGeometry(5.8, 4.5);
    this.planeMesh = new THREE.Mesh(geo, this.paperMaterial);
    this.planeMesh.position.set(0, this.baseY, -7.65);
    this.group.add(this.planeMesh);

    // 3. Sombra proyectada de papel en el respaldo del trono (Paper Mario Drop Shadow)
    const shadowGeo = new THREE.PlaneGeometry(5.6, 4.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050308,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.set(0.12, this.baseY - 0.08, -7.72);
    this.group.add(this.shadowMesh);

    // 4. Sello Arcano que brilla junto a la mano del jefe en la orden imperial
    const sigilGeo = new THREE.RingGeometry(0.35, 0.52, 6);
    const sigilMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.commandSigilRing = new THREE.Mesh(sigilGeo, sigilMat);
    this.commandSigilRing.position.set(1.35, 3.4, -7.2);
    PostProcessingPipeline.markForSelectiveBloom(this.commandSigilRing);
    this.group.add(this.commandSigilRing);

    scene.add(this.group);
    this.preloadAllRealmsPaperSprites();
  }

  private loadPaperSpritesForRealm(realmId: string): void {
    if (this.paperTexturesCache.has(realmId)) {
      this.paperTextures = this.paperTexturesCache.get(realmId)!;
      const currentTex = this.paperTextures.get(this.currentPose);
      if (currentTex) {
        this.paperMaterial.map = currentTex;
        this.paperMaterial.needsUpdate = true;
      }
      return;
    }

    const realmTextures = new Map<PaperPoseName, THREE.Texture>();
    this.paperTexturesCache.set(realmId, realmTextures);
    this.paperTextures = realmTextures;

    const poses: PaperPoseName[] = [
      'idle', 'thinking', 'calculating',
      'taunt', 'surprised', 'irritated',
      'fury_slam', 'focus_lean', 'defeat'
    ];

    poses.forEach((p) => {
      this.paperTextureLoader.load(
        `/assets/characters/${realmId}/sprites/${p}.png`,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          realmTextures.set(p, tex);

          // Si el reino activo en este momento es este y coincide la pose o aún no hay textura asignada
          if (this.currentRealm?.id === realmId && this.isPaperMode) {
            if (this.currentPose === p || !this.paperMaterial.map) {
              this.paperMaterial.map = tex;
              this.paperMaterial.needsUpdate = true;
            }
          }
        },
        undefined,
        (err) => {
          console.warn(`[PaperMario] No se pudo cargar sprite ${p} para ${realmId}`, err);
        }
      );
    });
  }

  private preloadAllRealmsPaperSprites(): void {
    const realmIds = [
      'eternal_crown', 'elven_throne', 'iron_bastion', 'ash_throne',
      'draconic_empire', 'shadow_court', 'celestial_sanctuary',
      'snow_dominion', 'sand_kingdom', 'void_throne'
    ];

    realmIds.forEach((id) => {
      this.loadPaperSpritesForRealm(id);
    });
  }

  public loadBossForRealm(realm: RealmConfig): void {
    this.currentRealm = realm;

    const sigilMat = this.commandSigilRing.material as THREE.MeshBasicMaterial;
    sigilMat.color.setHex(realm.palette.accent);

    this.isPaperMode = true;
    this.group.visible = true;
    this.planeMesh.material = this.paperMaterial;
    this.shadowMesh.visible = true;
    this.loadPaperSpritesForRealm(realm.id);
    this.applyPaperPose(this.mapStateToPose(this.currentState), true);
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  /**
   * Mapea los 18 estados emocionales del juego a las 9 poses de Paper Mario.
   */
  private mapStateToPose(state: CharacterAnimationState): PaperPoseName {
    switch (state) {
      case 'Idle':
        return 'idle';
      case 'Thinking':
        return 'thinking';
      case 'DeepThinking':
        return 'calculating';
      case 'Capture':
      case 'Taunt':
      case 'Confident':
      case 'Victory':
      case 'Laugh':
      case 'BrilliantMove':
        return 'taunt';
      case 'Surprised':
      case 'Curious':
        return 'surprised';
      case 'Check':
      case 'Blunder':
        return 'fury_slam';
      case 'PieceLost':
      case 'Annoyed':
        return 'irritated';
      case 'Defeat':
      case 'Checkmate':
        return 'defeat';
      case 'Respect':
        return 'focus_lean';
      default:
        return 'idle';
    }
  }

  public setAnimationState(state: CharacterAnimationState): void {
    const prevState = this.currentState;
    this.currentState = state;

    if (this.isPaperMode) {
      const newPose = this.mapStateToPose(state);
      if (newPose !== this.currentPose) {
        this.triggerPaperFlip(newPose);
      }

      // Reacciones físicas particulares al estilo Paper Mario
      if (state === 'Surprised') {
        this.hopProgress = 0; // Salto vertical elástico
      } else if (state === 'Check') {
        // En Jaque, impacto furioso de puño contra el trono
        this.squashOffset = 0.18;
        setTimeout(() => {
          this.onArmrestImpact?.();
          this.squashOffset = -0.22;
        }, 140);
      }
    }
  }

  /**
   * Giros en el eje Y tipo "Hoja de Papel" (Paper Flip de Paper Mario)
   */
  private triggerPaperFlip(targetPose: PaperPoseName): void {
    this.targetPose = targetPose;
    this.flipProgress = 0;
    this.isFlipping = true;
    this.hasSwappedInFlip = false;
  }

  private applyPaperPose(pose: PaperPoseName, instant = true): void {
    this.currentPose = pose;
    const tex = this.paperTextures.get(pose);
    if (tex) {
      this.paperMaterial.map = tex;
      this.paperMaterial.needsUpdate = true;
    }
  }

  public setPuppetCommandGesture(active: boolean): void {
    this.targetCommandArm = active ? 1.0 : 0.0;
    if (this.isPaperMode && active) {
      this.triggerPaperFlip('taunt');
    }
  }

  public triggerSpeechVocalization(durationMs: number): void {
    this.speechTimer = durationMs / 1000;
  }

  public setGazeTarget(normX: number, normY: number): void {
    this.gazeOffset.x = THREE.MathUtils.clamp(normX, -1, 1);
    this.gazeOffset.y = THREE.MathUtils.clamp(normY, -1, 1);
  }

  public getSpeechAnchorWorldPosition(): THREE.Vector3 {
    const worldPos = new THREE.Vector3();
    this.planeMesh.getWorldPosition(worldPos);
    // La boca y rostro del personaje se sitúan ~0.95 unidades sobre el centro del plano
    worldPos.y += 0.95;
    return worldPos;
  }

  public update(deltaSec: number, elapsedSec: number): void {
    if (!this.currentRealm) return;

    // 1. Sello arcano de la mano de títere
    this.commandArmRaise += (this.targetCommandArm - this.commandArmRaise) * Math.min(1, deltaSec * 8);
    const sigilMat = this.commandSigilRing.material as THREE.MeshBasicMaterial;
    sigilMat.opacity = this.commandArmRaise * 0.85;
    this.commandSigilRing.rotation.z = elapsedSec * 2.2;
    this.commandSigilRing.scale.setScalar(0.8 + this.commandArmRaise * 0.4);

    if (this.isPaperMode) {
      this.updatePaperMarioKinematics(deltaSec, elapsedSec);
    } else {
      this.updateCanvasMode(deltaSec, elapsedSec);
    }
  }

  /**
   * Cinemática Procedural Oficial de Paper Mario:
   * - Balanceo pendular continuo (Paper Rocking)
   * - Giro de carta en 3D al cambiar de expresión (Paper Flip)
   * - Rebote elástico al hablar o reaccionar (Squash & Stretch)
   * - Salto de susto (Paper Hop)
   */
  private updatePaperMarioKinematics(deltaSec: number, elapsedSec: number): void {
    // 1. Efecto de Giro de Hoja de Papel (Paper Flip)
    if (this.isFlipping) {
      this.flipProgress += deltaSec / 0.22; // Duración: 220ms

      if (this.flipProgress < 0.5) {
        // Se comprime hasta verse como el grosor de una hoja (escala X -> 0)
        const t = this.flipProgress / 0.5;
        this.baseScaleX = Math.max(0.005, 1.0 - t);
      } else {
        if (!this.hasSwappedInFlip) {
          this.applyPaperPose(this.targetPose, false);
          this.hasSwappedInFlip = true;
        }
        // Se expande hacia el otro lado con rebote elástico (overshoot)
        const t = (this.flipProgress - 0.5) / 0.5;
        const overshoot = 1.0 + Math.sin(t * Math.PI) * 0.18;
        this.baseScaleX = THREE.MathUtils.lerp(0.05, 1.0, t) * overshoot;
      }

      if (this.flipProgress >= 1.0) {
        this.baseScaleX = 1.0;
        this.isFlipping = false;
      }
    }

    // 2. Salto elástico de sorpresa (Paper Hop)
    let hopOffset = 0;
    if (this.hopProgress < 1.0) {
      this.hopProgress += deltaSec / 0.32;
      hopOffset = Math.sin(Math.min(1, this.hopProgress) * Math.PI) * 0.42;
    }

    // 3. Charloteo de boca/cuerpo en diálogos (Paper Speech Chatter)
    let chatterSquash = 0;
    if (this.speechTimer > 0) {
      this.speechTimer -= deltaSec;
      chatterSquash = Math.sin(elapsedSec * 24.0) * 0.045;
    }

    // 4. Decaimiento de compresión/estiramiento (Squash Decay)
    this.squashOffset *= Math.max(0, 1 - deltaSec * 6);

    // 5. Balanceo pendular característico de Paper Mario (Paper Rocking)
    const rockAngle = Math.sin(elapsedSec * 2.8) * 0.034;
    const idleBob = Math.sin(elapsedSec * 5.6) * 0.018;

    this.planeMesh.rotation.z = rockAngle;
    this.planeMesh.position.y = this.baseY + hopOffset + idleBob * 0.5;
    this.planeMesh.scale.x = this.baseScaleX * (1.0 - (this.squashOffset + chatterSquash) * 0.7);
    this.planeMesh.scale.y = this.baseScaleY * (1.0 + this.squashOffset + chatterSquash + idleBob);

    // 6. Sombra de papel que sigue el balanceo
    this.shadowMesh.rotation.z = rockAngle * 0.85;
    this.shadowMesh.position.y = this.baseY - 0.08 + hopOffset * 0.8;
    this.shadowMesh.scale.copy(this.planeMesh.scale);
  }

  private updateCanvasMode(deltaSec: number, elapsedSec: number): void {
    const blinkCycle = elapsedSec % 4.3;
    this.blinkValue = blinkCycle > 4.12 ? Math.sin(((blinkCycle - 4.12) / 0.18) * Math.PI) : 0;
    this.planeMesh.scale.y = 1.0 + Math.sin(elapsedSec * 1.9) * 0.012;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1024, 1024);
    AnimeBossThroneActor.drawAnimeCharacter(
      ctx,
      this.currentRealm,
      this.currentState,
      this.blinkValue,
      this.commandArmRaise,
      this.gazeOffset,
      elapsedSec
    );
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Genera la miniatura o retrato para el Selector de Reinos:
   * Retorna directamente el arte en alta resolución del gobernante correspondiente.
   */
  public static renderPortraitDataURL(realm: RealmConfig): string {
    return `/assets/bosses/${realm.id}.png`;
  }

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

    const auraGrad = ctx.createRadialGradient(512, 460, 60, 512, 460, 420);
    auraGrad.addColorStop(0, `${s.armorTrim}55`);
    auraGrad.addColorStop(0.5, `${s.capeColor}33`);
    auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(512, 460, 420, 0, Math.PI * 2);
    ctx.fill();

    // Capa y Hombros
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

    // Torso acorazado
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

    ctx.strokeStyle = s.armorTrim;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(320, 565); ctx.lineTo(512, 750); ctx.lineTo(704, 565);
    ctx.stroke();

    // Cuello
    ctx.fillStyle = s.skinCelShadow;
    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 6;
    ctx.fillRect(452, 435, 120, 125);
    ctx.strokeRect(452, 435, 120, 125);

    // Rostro Seinen
    ctx.fillStyle = s.skinBase;
    ctx.beginPath();
    ctx.moveTo(385, 250);
    ctx.lineTo(392, 385);
    ctx.lineTo(448, 468);
    ctx.lineTo(512, 492);
    ctx.lineTo(576, 468);
    ctx.lineTo(632, 385);
    ctx.lineTo(639, 250);
    ctx.quadraticCurveTo(512, 195, 385, 250);
    ctx.closePath();
    ctx.fill();

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

    // Ojos
    const isAngry = state === 'Check' || state === 'PieceLost' || state === 'Checkmate';
    const eyeOpenH = Math.max(2, 22 * (1 - blink));

    for (const dir of [-1, 1]) {
      const ex = 512 + dir * 56;
      const ey = 336;
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
        const ix = ex + gaze.x * 8;
        const iy = ey + gaze.y * 5;
        ctx.fillStyle = s.eyeColor;
        ctx.beginPath();
        ctx.arc(ix, iy, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#09070c';
      ctx.fillStyle = s.hairColor;
      ctx.lineWidth = 3;
      const browTilt = isAngry ? 14 : 6;
      ctx.beginPath();
      ctx.moveTo(ex - dir * 32, ey - 18 + browTilt);
      ctx.lineTo(ex + dir * 34, ey - 26 - browTilt * 0.5);
      ctx.lineTo(ex + dir * 30, ey - 16 - browTilt * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Nariz y boca
    ctx.fillStyle = s.skinDeepShadow;
    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(512, 328); ctx.lineTo(498, 398); ctx.lineTo(516, 404);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(482, 434); ctx.lineTo(542, 434);
    ctx.stroke();

    AnimeBossThroneActor.drawBossUniqueFeatures(ctx, s);
    ctx.restore();
  }

  private static drawBossUniqueFeatures(ctx: CanvasRenderingContext2D, s: AnimeBossStyle): void {
    ctx.strokeStyle = '#09070c';
    ctx.lineWidth = 5;

    if (s.feature === 'king_beard' || s.feature === 'dwarf_braids' || s.feature === 'viking_furs') {
      ctx.fillStyle = s.hairColor;
      ctx.beginPath();
      ctx.moveTo(392, 385); ctx.lineTo(445, 455); ctx.lineTo(512, 462); ctx.lineTo(579, 455); ctx.lineTo(632, 385);
      ctx.lineTo(605, 535); ctx.lineTo(555, 595); ctx.lineTo(512, 635); ctx.lineTo(469, 595); ctx.lineTo(419, 535);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = s.hairColor;
    ctx.beginPath();
    ctx.moveTo(375, 275); ctx.lineTo(335, 465); ctx.lineTo(388, 415); ctx.lineTo(395, 240);
    ctx.lineTo(629, 240); ctx.lineTo(636, 415); ctx.lineTo(689, 465); ctx.lineTo(649, 275);
    ctx.quadraticCurveTo(512, 165, 375, 275);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = s.armorTrim;
    ctx.beginPath();
    ctx.moveTo(380, 235); ctx.lineTo(395, 135); ctx.lineTo(452, 195); ctx.lineTo(512, 95); ctx.lineTo(572, 195);
    ctx.lineTo(629, 135); ctx.lineTo(644, 235);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
