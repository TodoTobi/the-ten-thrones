// src/systems/UIManager.ts
import { REALMS_CONFIG } from '../config/realms.config';
import { CharacterAnimationState, DifficultyLevel, PieceSymbol, RealmConfig } from '../core/types';
import { RivalAvatar2D } from '../rendering/RivalAvatar2D';
import { AnimeBossThroneActor } from '../rendering/AnimeBossThroneActor';
import { SaveProfileData } from './SaveSystem';

export class UIManager {
  public onStartMatch?: (realm: RealmConfig, difficulty: DifficultyLevel, customFen?: string) => void;
  public onRealmPreviewSelected?: (realm: RealmConfig) => void;
  public onCameraPresetChange?: (preset: 'gameplay' | 'cinematic' | 'top') => void;
  public onUndoRequest?: () => void;
  public onRestartRequest?: () => void;
  public onResignRequest?: () => void;

  private profile!: SaveProfileData;
  private selectedPreviewRealm: RealmConfig = REALMS_CONFIG[0];
  private hudBossAvatar!: RivalAvatar2D;
  private selectorBossAvatar!: RivalAvatar2D;
  public onBossArmrestImpact?: () => void;
  public onScreenChange?: (screenId: string) => void;

  private speechTimeoutId: number | null = null;
  private isBubbleActive = false;
  private currentTailSide: 'left' | 'right' = 'left';

  public init(profile: SaveProfileData): void {
    this.profile = profile;
    this.hudBossAvatar = new RivalAvatar2D('#hud-boss-avatar-mount');
    this.hudBossAvatar.onArmrestImpact = () => this.onBossArmrestImpact?.();
    this.selectorBossAvatar = new RivalAvatar2D('#selector-boss-hero-mount');

    const closeBtn = document.getElementById('btn-close-speech-bubble');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideSpeechBubble();
      });
    }
    const bubble = document.getElementById('rival-speech-bubble');
    if (bubble) {
      bubble.addEventListener('click', () => this.hideSpeechBubble());
    }

    const togglePgnMobile = document.getElementById('btn-toggle-pgn-mobile');
    const pgnPanel = document.querySelector('.hud-pgn-panel');
    const closePgn = document.getElementById('btn-close-pgn');

    togglePgnMobile?.addEventListener('click', (e) => {
      e.stopPropagation();
      pgnPanel?.classList.toggle('mobile-open');
    });
    closePgn?.addEventListener('click', (e) => {
      e.stopPropagation();
      pgnPanel?.classList.remove('mobile-open');
    });

    this.bindMenuButtons();
    this.renderRealmsSelectorRPG();
    this.selectRealmInSelector(REALMS_CONFIG[0]);
    this.updateStatsBanner();
  }

  public updateProfileData(profile: SaveProfileData): void {
    this.profile = profile;
    this.renderRealmsSelectorRPG();
    this.selectRealmInSelector(this.selectedPreviewRealm);
    this.updateStatsBanner();
  }

  public showScreen(screenId: 'main-menu' | 'realms-screen' | 'hud-screen' | 'settings-modal'): void {
    if (screenId !== 'hud-screen') {
      this.hideSpeechBubble();
    }
    document.querySelectorAll('.game-screen').forEach((el) => el.classList.add('hidden'));
    document.getElementById(screenId)?.classList.remove('hidden');
    this.onScreenChange?.(screenId);
  }

  public configureHudForRealm(realm: RealmConfig, difficulty: DifficultyLevel): void {
    this.setText('hud-realm-name', realm.name);
    this.setText('hud-rival-name', realm.rivalName);
    this.setText('hud-rival-title', realm.rivalTitle);
    this.setText('hud-difficulty', difficulty.toUpperCase());

    this.hudBossAvatar.renderBossForRealm(realm);
    this.hudBossAvatar.setAnimationState('Idle');
  }

  public setBossAnimationState(state: CharacterAnimationState): void {
    this.hudBossAvatar.setAnimationState(state);
  }

  private renderRealmsSelectorRPG(): void {
    const strip = document.getElementById('realms-roster-strip');
    if (!strip) return;
    strip.innerHTML = '';

    REALMS_CONFIG.forEach((realm) => {
      const isUnlocked = this.profile.unlockedRealms.includes(realm.id);
      const isSelected = realm.id === this.selectedPreviewRealm.id;

      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = `boss-roster-thumb ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'active' : ''}`;
      const portraitUrl = `/assets/characters/${realm.id}/portrait_thumb.png`;
      thumb.innerHTML = `
        <div class="thumb-portrait"><img src="${portraitUrl}" alt="${realm.rivalName}" style="width:100%;height:100%;object-fit:cover;"/></div>
        <span class="thumb-order">I${realm.order}</span>
        <span class="thumb-name">${realm.rivalName.split(' ')[0]}</span>
      `;

      thumb.addEventListener('click', () => this.selectRealmInSelector(realm));
      strip.appendChild(thumb);
    });
  }

  private selectRealmInSelector(realm: RealmConfig): void {
    this.selectedPreviewRealm = realm;
    const isUnlocked = this.profile.unlockedRealms.includes(realm.id);
    const best = this.profile.stats.bestResultByRealm[realm.id] || 'SIN DISPUTAR';

    // 1. Actualizar Retrato Principal de Medio Cuerpo
    const heroMount = document.getElementById('selector-boss-hero-mount');
    if (heroMount) {
      const heroUrl = AnimeBossThroneActor.renderPortraitDataURL(realm);
      heroMount.innerHTML = `<img src="${heroUrl}" alt="${realm.rivalName}" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 12px 24px rgba(0,0,0,0.65));"/>`;
    }

    // 2. Actualizar Ficha Editorial del Reino
    this.setText('sel-realm-order', `TRONO ${realm.order} DE X — ${realm.civilization.toUpperCase()}`);
    this.setText('sel-realm-title', realm.name);
    this.setText('sel-rival-name', `${realm.rivalName}, ${realm.rivalTitle}`);
    this.setText('sel-realm-quote', `«${realm.dialogues.GAME_START[0]?.text || ''}»`);
    this.setText('sel-realm-style', realm.playStyle.description);
    this.setText('sel-realm-diff', realm.recommendedDifficulty.toUpperCase());
    this.setText('sel-realm-record', best.toUpperCase());

    const startBtn = document.getElementById('btn-selector-challenge') as HTMLButtonElement | null;
    const lockMsg = document.getElementById('sel-lock-requirement');
    if (startBtn && lockMsg) {
      startBtn.disabled = !isUnlocked;
      startBtn.textContent = isUnlocked ? `DESAFIAR A ${realm.rivalName.toUpperCase()}` : 'TRONO SELLADO';
      lockMsg.textContent = isUnlocked
        ? 'Reino disponible para duelo oficial.'
        : `Requisito de desbloqueo: Derrota al gobernante del Trono ${realm.order - 1}.`;
    }

    // Marcar miniatura activa
    this.renderRealmsSelectorRPG();

    // 3. Notificar a SceneManager y AudioManager para que el fondo 3D cambie en vivo
    this.onRealmPreviewSelected?.(realm);
  }

  public updateTurnStatus(turn: 'w' | 'b', inCheck: boolean, moveHistory: string[]): void {
    const turnBadge = document.getElementById('hud-turn-indicator');
    if (turnBadge) {
      turnBadge.textContent = turn === 'w' ? 'TU TURNO (BLANCAS)' : 'TURNO DEL RIVAL (NEGRAS)';
      turnBadge.className = `turn-badge ${turn === 'w' ? 'player-turn' : 'rival-turn'}`;
    }

    document.getElementById('hud-check-alert')?.classList.toggle('hidden', !inCheck);

    const historyEl = document.getElementById('hud-move-history');
    if (historyEl) {
      const pairs: string[] = [];
      for (let i = 0; i < moveHistory.length; i += 2) {
        pairs.push(`<span><b>${Math.floor(i / 2) + 1}.</b> ${moveHistory[i]} ${moveHistory[i + 1] || ''}</span>`);
      }
      historyEl.innerHTML = pairs.join(' ');
      historyEl.scrollTop = historyEl.scrollHeight;
    }
  }

  public lookAtSquare(square: string): void {
    this.hudBossAvatar.lookAtBoardSquare(square);
  }

  public showSpeechBubble(text: string, soundCue: string, state: CharacterAnimationState = 'Idle'): void {
    const bubble = document.getElementById('rival-speech-bubble');
    if (!bubble) return;

    if (this.speechTimeoutId !== null) {
      window.clearTimeout(this.speechTimeoutId);
      this.speechTimeoutId = null;
    }

    const soundCueEl = document.getElementById('rival-sound-cue');
    if (soundCueEl) {
      soundCueEl.textContent = soundCue ? soundCue.toUpperCase() : 'ORDEN IMPERIAL';
    }

    const textEl = document.getElementById('rival-dialogue-text');
    if (textEl) {
      textEl.textContent = `«${text}»`;
    }

    // Adaptar clase de diseño manga según estado emocional
    bubble.classList.remove('manga-bubble-rage', 'manga-bubble-thought', 'manga-bubble-normal');
    if (['Check', 'PieceLost'].includes(state)) {
      bubble.classList.add('manga-bubble-rage');
    } else if (['Thinking', 'DeepThinking'].includes(state)) {
      bubble.classList.add('manga-bubble-thought');
    } else {
      bubble.classList.add('manga-bubble-normal');
    }

    bubble.classList.remove('hidden', 'manga-pop-out', 'manga-pop-in');
    void bubble.offsetWidth; // Forzar reflow para reiniciar animación pop-in
    bubble.classList.add('manga-pop-in');

    this.isBubbleActive = true;

    // Desvanecimiento automático proporcional a la lectura
    const readDuration = Math.min(6800, Math.max(3800, text.length * 62));
    this.speechTimeoutId = window.setTimeout(() => {
      this.hideSpeechBubble();
    }, readDuration);

    this.hudBossAvatar.triggerSpeechVocalization(Math.min(3200, Math.max(1200, text.length * 38)));
  }

  public hideSpeechBubble(): void {
    const bubble = document.getElementById('rival-speech-bubble');
    if (!bubble || !this.isBubbleActive) return;

    if (this.speechTimeoutId !== null) {
      window.clearTimeout(this.speechTimeoutId);
      this.speechTimeoutId = null;
    }

    bubble.classList.remove('manga-pop-in');
    bubble.classList.add('manga-pop-out');

    setTimeout(() => {
      bubble.classList.add('hidden');
      bubble.classList.remove('manga-pop-out');
      this.isBubbleActive = false;
    }, 180);
  }

  public isSpeechBubbleActive(): boolean {
    return this.isBubbleActive;
  }

  public updateSpeechBubblePosition(headX: number, headY: number, isVisible: boolean): void {
    const bubble = document.getElementById('rival-speech-bubble');
    if (!bubble || !this.isBubbleActive) return;

    const tailEl = bubble.querySelector('.manga-tail-container') as HTMLElement | null;
    const bubbleWidth = bubble.offsetWidth || 300;
    const bubbleHeight = bubble.offsetHeight || 100;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // En pantallas de celulares o tablets estrechas (<= 768px), centrar el globo
    // como banner de diálogo cinematográfico debajo de la barra superior
    if (screenW <= 768) {
      bubble.classList.add('mobile-speech-bubble');
      bubble.style.left = '10px';
      bubble.style.right = '10px';
      bubble.style.top = '66px';
      bubble.style.width = 'calc(100vw - 20px)';
      if (tailEl) tailEl.style.display = 'none';
      return;
    }

    bubble.classList.remove('mobile-speech-bubble');
    bubble.style.right = 'auto';
    bubble.style.width = 'auto';

    if (!isVisible || headY < -60 || headY > screenH + 60) {
      // Posición de respaldo en vista cenital/táctica
      bubble.style.left = `${Math.round((screenW - bubbleWidth) / 2)}px`;
      bubble.style.top = '72px';
      if (tailEl) tailEl.style.display = 'none';
      return;
    }

    if (tailEl) tailEl.style.display = 'block';

    // Determinar lado óptimo (derecha o izquierda del rostro)
    let targetLeft: number;
    let tailSide: 'left' | 'right';

    if (headX + 40 + bubbleWidth < screenW - 20) {
      targetLeft = headX + 35;
      tailSide = 'left';
    } else {
      targetLeft = headX - bubbleWidth - 35;
      tailSide = 'right';
    }

    // Posicionamiento vertical: ligeramente por encima del nivel de los ojos/boca
    let targetTop = headY - 80;

    // Clamping para no salirse de pantalla
    targetTop = Math.max(16, Math.min(screenH - bubbleHeight - 110, targetTop));
    targetLeft = Math.max(16, Math.min(screenW - bubbleWidth - 16, targetLeft));

    bubble.style.left = `${Math.round(targetLeft)}px`;
    bubble.style.top = `${Math.round(targetTop)}px`;

    if (tailSide !== this.currentTailSide) {
      this.currentTailSide = tailSide;
      bubble.classList.toggle('tail-left', tailSide === 'left');
      bubble.classList.toggle('tail-right', tailSide === 'right');
      if (tailEl) {
        tailEl.classList.toggle('tail-left', tailSide === 'left');
        tailEl.classList.toggle('tail-right', tailSide === 'right');
      }
    }
  }

  public promptPawnPromotion(): Promise<PieceSymbol> {
    return new Promise((resolve) => {
      const modal = document.getElementById('promotion-modal');
      if (!modal) return resolve('q');
      modal.classList.remove('hidden');
      const handler = (e: Event) => {
        const btn = (e.target as HTMLElement).closest('button[data-piece]') as HTMLElement | null;
        if (!btn) return;
        modal.classList.add('hidden');
        modal.removeEventListener('click', handler);
        resolve((btn.dataset.piece as PieceSymbol) || 'q');
      };
      modal.addEventListener('click', handler);
    });
  }

  public showMatchEndBanner(title: string, subtitle: string): void {
    this.setText('match-end-title', title);
    this.setText('match-end-subtitle', subtitle);
    document.getElementById('match-end-modal')?.classList.remove('hidden');
  }

  private updateStatsBanner(): void {
    this.setText(
      'menu-stats-summary',
      `VICTORIAS: ${this.profile.stats.wins}  •  DERROTAS: ${this.profile.stats.losses}  •  TABLAS: ${this.profile.stats.draws}  •  TRONOS CONQUISTADOS: ${this.profile.unlockedRealms.length}/10`
    );
    const continueBtn = document.getElementById('btn-continue-match') as HTMLButtonElement | null;
    if (continueBtn) continueBtn.disabled = !this.profile.activeMatch;
  }

  private bindMenuButtons(): void {
    document.getElementById('btn-open-realms')?.addEventListener('click', () => this.showScreen('realms-screen'));
    document.getElementById('btn-back-menu')?.addEventListener('click', () => this.showScreen('main-menu'));

    document.getElementById('btn-selector-challenge')?.addEventListener('click', () => {
      this.onStartMatch?.(this.selectedPreviewRealm, this.selectedPreviewRealm.recommendedDifficulty);
    });

    // Navegación por teclado entre los 10 jefes en la pantalla de selección
    window.addEventListener('keydown', (e) => {
      const realmsScreen = document.getElementById('realms-screen');
      if (!realmsScreen || realmsScreen.classList.contains('hidden')) return;
      const idx = REALMS_CONFIG.findIndex((r) => r.id === this.selectedPreviewRealm.id);
      if (e.key === 'ArrowRight' && idx < REALMS_CONFIG.length - 1) {
        this.selectRealmInSelector(REALMS_CONFIG[idx + 1]);
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        this.selectRealmInSelector(REALMS_CONFIG[idx - 1]);
      }
    });

    document.getElementById('btn-quick-match')?.addEventListener('click', () => {
      this.onStartMatch?.(REALMS_CONFIG[0], this.profile.settings.gameplay.defaultDifficulty);
    });

    document.getElementById('btn-continue-match')?.addEventListener('click', () => {
      if (!this.profile.activeMatch) return;
      const realm = REALMS_CONFIG.find((r) => r.id === this.profile.activeMatch?.realmId) || REALMS_CONFIG[0];
      this.onStartMatch?.(realm, this.profile.activeMatch.difficulty as DifficultyLevel, this.profile.activeMatch.fen);
    });

    document.getElementById('btn-cam-gameplay')?.addEventListener('click', () => this.onCameraPresetChange?.('gameplay'));
    document.getElementById('btn-cam-cinematic')?.addEventListener('click', () => this.onCameraPresetChange?.('cinematic'));
    document.getElementById('btn-cam-top')?.addEventListener('click', () => this.onCameraPresetChange?.('top'));

    document.getElementById('btn-hud-undo')?.addEventListener('click', () => this.onUndoRequest?.());
    document.getElementById('btn-hud-restart')?.addEventListener('click', () => this.onRestartRequest?.());
    document.getElementById('btn-hud-resign')?.addEventListener('click', () => this.onResignRequest?.());
    document.getElementById('btn-match-end-menu')?.addEventListener('click', () => {
      document.getElementById('match-end-modal')?.classList.add('hidden');
      this.showScreen('realms-screen');
    });
  }

  private setText(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}
