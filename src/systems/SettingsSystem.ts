// src/systems/SettingsSystem.ts
import { DifficultyLevel, GameSettings, PieceColor } from '../core/types';
import { AudioManager } from './AudioManager';
import { PerformanceManager, QualityTier } from './PerformanceManager';
import { SaveProfileData, SaveSystem } from './SaveSystem';

export class SettingsSystem {
  private profile: SaveProfileData;
  private saveSystem: SaveSystem;
  private perfManager: PerformanceManager;
  private audioManager: AudioManager;

  public onBoardOrientationChanged?: (orientation: PieceColor) => void;
  public onSettingsSaved?: (settings: GameSettings) => void;
  public onProgressReset?: () => void;

  constructor(
    profile: SaveProfileData,
    saveSystem: SaveSystem,
    perfManager: PerformanceManager,
    audioManager: AudioManager
  ) {
    this.profile = profile;
    this.saveSystem = saveSystem;
    this.perfManager = perfManager;
    this.audioManager = audioManager;

    this.applyAllSettingsToEngine(this.profile.settings);
    this.bindModalDOMEvents();
    this.syncFormValuesFromSettings(this.profile.settings);
  }

  public openModal(): void {
    this.syncFormValuesFromSettings(this.profile.settings);
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.remove('hidden');
      const firstInput = modal.querySelector('select, input, button') as HTMLElement | null;
      firstInput?.focus();
    }
  }

  public closeModal(): void {
    document.getElementById('settings-modal')?.classList.add('hidden');
  }

  public getSettings(): GameSettings {
    return this.profile.settings;
  }

  /**
   * Aplica inmediatamente todas las preferencias activas a los subsistemas del motor
   * (Renderizador 3D, Post-procesado, Mezclador de Audio y Variables CSS de Accesibilidad).
   */
  public applyAllSettingsToEngine(settings: GameSettings): void {
    // 1. Gráficos y PerformanceManager
    this.perfManager.setUserTargetQuality(settings.graphics.quality);
    const currentPreset = this.perfManager.getCurrentPreset();
    this.perfManager.applyPreset({
      ...currentPreset,
      shadowsEnabled: settings.graphics.shadows,
      particlesEnabled: settings.graphics.particles,
      renderScale: settings.graphics.renderScale,
    });

    // 2. Audio (Master, Música, Efectos y Silencio)
    this.audioManager.setVolumes(
      settings.audio.master,
      settings.audio.music,
      settings.audio.sfx,
      settings.audio.muted
    );

    // 3. Accesibilidad en el DOM (Escala de UI, Alto Contraste y Movimiento Reducido)
    const root = document.documentElement;
    root.style.setProperty('--ui-scale', String(settings.accessibility.uiScale));
    document.body.classList.toggle('high-contrast', settings.accessibility.highContrast);
    document.body.classList.toggle('reduced-motion', settings.accessibility.reducedMotion);

    const speechBubble = document.getElementById('rival-speech-bubble');
    if (speechBubble && !settings.accessibility.showSubtitles) {
      speechBubble.classList.add('hidden');
    }
  }

  private syncFormValuesFromSettings(s: GameSettings): void {
    this.setVal('set-gfx-quality', s.graphics.quality);
    this.setChecked('set-gfx-adaptive', this.perfManager.adaptiveQualityEnabled);
    this.setChecked('set-gfx-shadows', s.graphics.shadows);
    this.setChecked('set-gfx-particles', s.graphics.particles);
    this.setChecked('set-gfx-cinematic', s.graphics.cinematicAnimations);
    this.setVal('set-gfx-scale', String(s.graphics.renderScale));
    this.setText('lbl-gfx-scale', `${Math.round(s.graphics.renderScale * 100)}%`);

    this.setVal('set-aud-master', String(Math.round(s.audio.master * 100)));
    this.setText('lbl-aud-master', `${Math.round(s.audio.master * 100)}%`);
    this.setVal('set-aud-music', String(Math.round(s.audio.music * 100)));
    this.setText('lbl-aud-music', `${Math.round(s.audio.music * 100)}%`);
    this.setVal('set-aud-sfx', String(Math.round(s.audio.sfx * 100)));
    this.setText('lbl-aud-sfx', `${Math.round(s.audio.sfx * 100)}%`);
    this.setChecked('set-aud-muted', s.audio.muted);

    this.setVal('set-game-difficulty', s.gameplay.defaultDifficulty);
    this.setChecked('set-game-legal', s.gameplay.showLegalMoves);
    this.setVal('set-game-speed', String(s.gameplay.animationSpeed));
    this.setText('lbl-game-speed', `${s.gameplay.animationSpeed.toFixed(1)}x`);
    this.setVal('set-game-orientation', s.gameplay.boardOrientation);

    this.setVal('set-acc-scale', String(s.accessibility.uiScale));
    this.setText('lbl-acc-scale', `${Math.round(s.accessibility.uiScale * 100)}%`);
    this.setChecked('set-acc-contrast', s.accessibility.highContrast);
    this.setChecked('set-acc-motion', s.accessibility.reducedMotion);
    this.setChecked('set-acc-notaunts', s.accessibility.disableTaunts);
    this.setChecked('set-acc-subtitles', s.accessibility.showSubtitles);
  }

  private bindModalDOMEvents(): void {
    // Pestañas del modal
    document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetTab = (e.currentTarget as HTMLElement).dataset.tab;
        document.querySelectorAll('.settings-tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.settings-tab-content').forEach((c) => c.classList.add('hidden'));
        (e.currentTarget as HTMLElement).classList.add('active');
        if (targetTab) document.getElementById(targetTab)?.classList.remove('hidden');
      });
    });

    // Cerrar con tecla Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('settings-modal');
        if (modal && !modal.classList.contains('hidden')) {
          this.closeModal();
        }
      }
    });

    // Botones de apertura/cierre
    document.getElementById('btn-open-settings')?.addEventListener('click', () => this.openModal());
    document.getElementById('btn-hud-settings')?.addEventListener('click', () => this.openModal());
    document.getElementById('btn-close-settings')?.addEventListener('click', () => this.closeModal());

    // Pantalla completa real (Fullscreen API)
    document.getElementById('btn-toggle-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Reinicio de progreso confirmado
    document.getElementById('btn-reset-progress')?.addEventListener('click', async () => {
      const confirmed = window.confirm(
        '¿Estás seguro de que deseas borrar todo el progreso de campaña y estadísticas? Esta acción no se puede deshacer.'
      );
      if (!confirmed) return;
      const fresh = this.saveSystem.getDefaultProfile();
      this.profile.unlockedRealms = fresh.unlockedRealms;
      this.profile.activeMatch = null;
      this.profile.stats = fresh.stats;
      await this.saveSystem.saveProfile(this.profile);
      this.onProgressReset?.();
      this.closeModal();
    });

    // Escuchar cambios en vivo en todos los inputs del formulario
    const form = document.getElementById('settings-form');
    form?.addEventListener('input', () => this.readFormAndApplyLive());
    form?.addEventListener('change', () => this.readFormAndApplyLive());
  }

  private async readFormAndApplyLive(): Promise<void> {
    const s = this.profile.settings;
    const prevOrientation = s.gameplay.boardOrientation;

    // Gráficos
    s.graphics.quality = this.getVal('set-gfx-quality') as QualityTier;
    this.perfManager.adaptiveQualityEnabled = this.getChecked('set-gfx-adaptive');
    s.graphics.shadows = this.getChecked('set-gfx-shadows');
    s.graphics.particles = this.getChecked('set-gfx-particles');
    s.graphics.cinematicAnimations = this.getChecked('set-gfx-cinematic');
    s.graphics.renderScale = parseFloat(this.getVal('set-gfx-scale') || '1');
    this.setText('lbl-gfx-scale', `${Math.round(s.graphics.renderScale * 100)}%`);

    // Audio
    s.audio.master = parseInt(this.getVal('set-aud-master') || '85', 10) / 100;
    s.audio.music = parseInt(this.getVal('set-aud-music') || '70', 10) / 100;
    s.audio.sfx = parseInt(this.getVal('set-aud-sfx') || '80', 10) / 100;
    s.audio.muted = this.getChecked('set-aud-muted');
    this.setText('lbl-aud-master', `${Math.round(s.audio.master * 100)}%`);
    this.setText('lbl-aud-music', `${Math.round(s.audio.music * 100)}%`);
    this.setText('lbl-aud-sfx', `${Math.round(s.audio.sfx * 100)}%`);

    // Jugabilidad
    s.gameplay.defaultDifficulty = this.getVal('set-game-difficulty') as DifficultyLevel;
    s.gameplay.showLegalMoves = this.getChecked('set-game-legal');
    s.gameplay.animationSpeed = parseFloat(this.getVal('set-game-speed') || '1');
    s.gameplay.boardOrientation = this.getVal('set-game-orientation') as PieceColor;
    this.setText('lbl-game-speed', `${s.gameplay.animationSpeed.toFixed(1)}x`);

    // Accesibilidad
    s.accessibility.uiScale = parseFloat(this.getVal('set-acc-scale') || '1');
    s.accessibility.highContrast = this.getChecked('set-acc-contrast');
    s.accessibility.reducedMotion = this.getChecked('set-acc-motion');
    s.accessibility.disableTaunts = this.getChecked('set-acc-notaunts');
    s.accessibility.showSubtitles = this.getChecked('set-acc-subtitles');

    this.applyAllSettingsToEngine(s);
    await this.saveSystem.saveProfile(this.profile);
    this.onSettingsSaved?.(s);
    if (prevOrientation !== s.gameplay.boardOrientation) {
      this.onBoardOrientationChanged?.(s.gameplay.boardOrientation);
    }
  }

  private getVal(id: string): string {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    return el?.value ?? '';
  }

  private setVal(id: string, val: string): void {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (el) el.value = val;
  }

  private getChecked(id: string): boolean {
    const el = document.getElementById(id) as HTMLInputElement | null;
    return el?.checked ?? false;
  }

  private setChecked(id: string, val: boolean): void {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.checked = val;
  }

  private setText(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}
