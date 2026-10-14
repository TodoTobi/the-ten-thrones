// src/systems/PerformanceManager.ts

import * as THREE from 'three';

import { PostProcessingPipeline } from '../rendering/PostProcessingPipeline';



export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';



export interface QualityPreset {

  tier: QualityTier;

  pixelRatioMax: number;

  renderScale: number;

  shadowsEnabled: boolean;

  bloomEnabled: boolean;

  particlesEnabled: boolean;

}



const QUALITY_TIERS: QualityPreset[] = [

  {

    tier: 'low',

    pixelRatioMax: 1.0,

    renderScale: 0.75,

    shadowsEnabled: false,

    bloomEnabled: false,

    particlesEnabled: false,

  },

  {

    tier: 'medium',

    pixelRatioMax: 1.25,

    renderScale: 0.9,

    shadowsEnabled: true,

    bloomEnabled: false,

    particlesEnabled: true,

  },

  {

    tier: 'high',

    pixelRatioMax: 1.5,

    renderScale: 1.0,

    shadowsEnabled: true,

    bloomEnabled: true,

    particlesEnabled: true,

  },

  {

    tier: 'ultra',

    pixelRatioMax: 2.0,

    renderScale: 1.0,

    shadowsEnabled: true,

    bloomEnabled: true,

    particlesEnabled: true,

  },

];



export class PerformanceManager {

  private renderer: THREE.WebGLRenderer;

  private postProcessing: PostProcessingPipeline;



  private frameDeltas: number[] = [];

  private readonly sampleSize = 90; // ~1.5 segundos a 60 FPS

  private lastAdjustmentTime = 0;

  private readonly cooldownMs = 4500; // Evita oscilaciones bruscas de calidad



  private currentTierIndex = 2; // Inicia en 'high'

  private maxAllowedTierIndex = 3; // Límite elegido por el usuario en Ajustes

  public adaptiveQualityEnabled = true;



  public onQualityTierChanged?: (preset: QualityPreset, currentFps: number) => void;



  constructor(

    renderer: THREE.WebGLRenderer,

    postProcessing: PostProcessingPipeline,

    initialTier: QualityTier = 'high'

  ) {

    this.renderer = renderer;

    this.postProcessing = postProcessing;

    this.setUserTargetQuality(initialTier);

  }



  public setUserTargetQuality(tier: QualityTier): void {

    const idx = QUALITY_TIERS.findIndex((t) => t.tier === tier);

    this.maxAllowedTierIndex = idx >= 0 ? idx : 2;

    this.currentTierIndex = this.maxAllowedTierIndex;

    this.applyPreset(QUALITY_TIERS[this.currentTierIndex]);

  }



  public recordFrame(deltaSeconds: number): void {

    // Ignorar pausas por cambio de pestaña del navegador (> 250ms)

    if (deltaSeconds <= 0 || deltaSeconds > 0.25) return;



    this.frameDeltas.push(deltaSeconds);

    if (this.frameDeltas.length > this.sampleSize) {

      this.frameDeltas.shift();

    }



    if (!this.adaptiveQualityEnabled || this.frameDeltas.length < this.sampleSize) {

      return;

    }



    const now = performance.now();

    if (now - this.lastAdjustmentTime < this.cooldownMs) return;



    const avgFps = this.getAverageFps();



    // Degradación automática si cae por debajo de 48 FPS

    if (avgFps < 48 && this.currentTierIndex > 0) {

      this.currentTierIndex--;

      this.lastAdjustmentTime = now;

      this.frameDeltas = [];

      const preset = QUALITY_TIERS[this.currentTierIndex];

      this.applyPreset(preset);

      this.onQualityTierChanged?.(preset, Math.round(avgFps));

    }

    // Recuperación progresiva si sostiene > 58 FPS estables

    else if (avgFps > 58 && this.currentTierIndex < this.maxAllowedTierIndex) {

      this.currentTierIndex++;

      this.lastAdjustmentTime = now;

      this.frameDeltas = [];

      const preset = QUALITY_TIERS[this.currentTierIndex];

      this.applyPreset(preset);

      this.onQualityTierChanged?.(preset, Math.round(avgFps));

    }

  }



  public getAverageFps(): number {

    if (this.frameDeltas.length === 0) return 60;

    const sum = this.frameDeltas.reduce((acc, d) => acc + d, 0);

    return this.frameDeltas.length / sum;

  }



  public getCurrentPreset(): QualityPreset {

    return QUALITY_TIERS[this.currentTierIndex];

  }



  public applyPreset(preset: QualityPreset): void {

    const targetPixelRatio = Math.min(window.devicePixelRatio || 1, preset.pixelRatioMax) * preset.renderScale;



    this.renderer.setPixelRatio(targetPixelRatio);

    this.renderer.shadowMap.enabled = preset.shadowsEnabled;



    this.postProcessing.setBloomEnabled(preset.bloomEnabled);

    this.postProcessing.setSize(window.innerWidth, window.innerHeight, targetPixelRatio);

  }

}
