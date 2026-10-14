// src/main.ts
import * as THREE from 'three';
import { Chess } from 'chess.js';
import { REALMS_CONFIG } from './config/realms.config';
import { ChessRules } from './core/ChessRules';
import { ChessAI } from './core/ChessAI';
import { DifficultyLevel, GameEventType, MoveResult, RealmConfig } from './core/types';
import { Board3D } from './rendering/Board3D';
import { RivalHand3D } from './rendering/RivalHand3D';
import { SceneManager } from './rendering/SceneManager';
import { AudioManager, MUSIC_MANIFEST } from './systems/AudioManager';
import { CharacterSystem } from './systems/CharacterSystem';
import { DialogueSystem } from './systems/DialogueSystem';
import { SaveProfileData, SaveSystem } from './systems/SaveSystem';
import { UIManager } from './systems/UIManager';
import { PostProcessingPipeline } from './rendering/PostProcessingPipeline';
import { PerformanceManager } from './systems/PerformanceManager';
import { AssetLoader } from './rendering/AssetLoader';
import { SettingsSystem } from './systems/SettingsSystem';
import { AnimeBossThroneActor } from './rendering/AnimeBossThroneActor';
import { BossIntroDirector } from './rendering/BossIntroDirector';

class TenThronesGame {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();

  private rules = new ChessRules();
  private ai = new ChessAI();
  private board3D!: Board3D;
  private rivalHand!: RivalHand3D;
  private sceneManager!: SceneManager;
  private bossThroneActor!: AnimeBossThroneActor;
  private introDirector = new BossIntroDirector();
  private characterSystem!: CharacterSystem;
  private dialogueSystem = new DialogueSystem();
  private audioManager = new AudioManager();
  private saveSystem = new SaveSystem();
  private uiManager = new UIManager();
  private postProcessing!: PostProcessingPipeline;
  private performanceManager!: PerformanceManager;
  private settingsSystem!: SettingsSystem;

  private profile!: SaveProfileData;
  private activeRealm: RealmConfig = REALMS_CONFIG[0];
  private activeDifficulty: DifficultyLevel = 'intermediate';
  private isBusy = false;

  public async bootstrap(): Promise<void> {
    await this.saveSystem.init();
    this.profile = await this.saveSystem.loadProfile();

    this.initThreeEngine();
    this.sceneManager = new SceneManager(this.scene);
    this.board3D = new Board3D(this.scene, this.camera, this.renderer.domElement);
    this.rivalHand = new RivalHand3D(this.scene);
    this.bossThroneActor = new AnimeBossThroneActor(this.scene);
    this.bossThroneActor.loadBossForRealm(this.activeRealm);
    this.rivalHand.onBossOrderGesture = (active) => {
      this.bossThroneActor.setPuppetCommandGesture(active);
    };
    this.characterSystem = new CharacterSystem(this.activeRealm);

    // Cargar fondo 3D inicial en el menú con precarga de assets
    await AssetLoader.getInstance().preloadRealmAssets(this.activeRealm.id);
    this.sceneManager.loadRealmEnvironment(this.activeRealm, true);
    this.sceneManager.configureBloomForRealm(this.activeRealm, this.postProcessing);
    this.board3D.buildBoardForRealm(this.activeRealm);
    this.board3D.syncPiecesFromMatrix(this.rules.getBoardMatrix());

    this.settingsSystem = new SettingsSystem(
      this.profile,
      this.saveSystem,
      this.performanceManager,
      this.audioManager
    );

    this.bindBoardAndUICallbacks();
    this.uiManager.init(this.profile);
    this.uiManager.showScreen('main-menu');

    this.animate();
  }

  private initThreeEngine(): void {
    const container = document.getElementById('webgl-viewport')!;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.postProcessing = new PostProcessingPipeline(this.renderer, this.scene, this.camera);
    this.performanceManager = new PerformanceManager(
      this.renderer,
      this.postProcessing,
      this.profile.settings.graphics.quality
    );

    this.performanceManager.onQualityTierChanged = (preset, fps) => {
      console.info(`[PerformanceManager] Ajuste dinámico a '${preset.tier.toUpperCase()}' (${fps} FPS medidos)`);
    };

    window.addEventListener('resize', () => {
      const preset = this.performanceManager.getCurrentPreset();
      const pr = Math.min(window.devicePixelRatio || 1, preset.pixelRatioMax) * preset.renderScale;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.postProcessing.setSize(window.innerWidth, window.innerHeight, pr);
    });
  }

  private bindBoardAndUICallbacks(): void {
    this.uiManager.onBossArmrestImpact = () => {
      if (!this.profile.settings.accessibility.reducedMotion) {
        this.board3D.triggerImpactShake(0.16, 280);
      }
      this.audioManager.playSfx('capture');
    };

    this.bossThroneActor.onArmrestImpact = () => {
      if (!this.profile.settings.accessibility.reducedMotion) {
        this.board3D.triggerImpactShake(0.18, 300);
      }
      this.audioManager.playSfx('capture');
    };

    this.board3D.onSquareSelected = (sq) => {
      if (this.isBusy || this.rules.getTurn() !== 'w' || this.rules.isGameOver()) return [];
      return this.rules.getLegalMoves(sq).map((m) => m.to);
    };

    this.board3D.onMoveAttempt = async (from, to) => {
      if (this.isBusy || this.rules.getTurn() !== 'w') return;
      await this.handlePlayerMove(from, to);
    };

    this.uiManager.onStartMatch = (realm, difficulty, customFen) => {
      this.startMatch(realm, difficulty, customFen);
    };

    this.uiManager.onRealmPreviewSelected = (realm) => {
      this.sceneManager.loadRealmEnvironment(realm, this.profile.settings.graphics.particles);
      this.sceneManager.configureBloomForRealm(realm, this.postProcessing);
      this.bossThroneActor.loadBossForRealm(realm);
      this.board3D.buildBoardForRealm(realm);
      this.board3D.syncPiecesFromMatrix(this.rules.getBoardMatrix());
      this.audioManager.playMusic(realm.id as keyof typeof MUSIC_MANIFEST);
    };

    this.uiManager.onCameraPresetChange = (preset) => {
      this.board3D.setCameraPreset(preset);
    };

    this.uiManager.onUndoRequest = () => {
      if (this.isBusy || this.rules.getHistory().length < 2) return;
      this.rules.undo(); // Deshace jugada de IA
      this.rules.undo(); // Deshace jugada del jugador
      this.board3D.syncPiecesFromMatrix(this.rules.getBoardMatrix());
      this.uiManager.updateTurnStatus(this.rules.getTurn(), false, this.rules.getHistory());
    };

    this.uiManager.onRestartRequest = () => {
      this.ai.cancelSearch();
      this.startMatch(this.activeRealm, this.activeDifficulty);
    };

    this.uiManager.onResignRequest = async () => {
      this.ai.cancelSearch();
      this.emitDialogue('RESIGNATION');
      await this.concludeMatch('defeat', 'Has abdicado la partida');
    };
  }

  public async startMatch(realm: RealmConfig, difficulty: DifficultyLevel, customFen?: string): Promise<void> {
    this.isBusy = true;
    this.activeRealm = realm;
    this.activeDifficulty = difficulty;

    await AssetLoader.getInstance().preloadRealmAssets(realm.id);

    this.rules = new ChessRules(customFen);
    this.sceneManager.loadRealmEnvironment(realm, this.profile.settings.graphics.particles);
    this.sceneManager.configureBloomForRealm(realm, this.postProcessing);
    this.board3D.buildBoardForRealm(realm);
    this.board3D.syncPiecesFromMatrix(this.rules.getBoardMatrix());
    this.rivalHand.configureForRealm(realm);
    this.characterSystem.resetForRealm(realm);

    this.audioManager.playMusic(realm.id as keyof typeof MUSIC_MANIFEST);
    this.uiManager.configureHudForRealm(realm, difficulty);
    this.uiManager.updateTurnStatus(this.rules.getTurn(), false, this.rules.getHistory());
    this.bossThroneActor.loadBossForRealm(realm);
    this.uiManager.showScreen('hud-screen');

    if (this.profile.settings.graphics.cinematicAnimations && !customFen) {
      await this.introDirector.playBossIntroCutscene(
        this.camera,
        this.bossThroneActor,
        realm,
        () => this.board3D.setCameraPreset('gameplay')
      );
    } else {
      this.board3D.setCameraPreset('gameplay');
    }

    this.emitDialogue('GAME_START');
    this.isBusy = false;
  }

  private async handlePlayerMove(from: string, to: string): Promise<void> {
    this.isBusy = true;

    let promotionPiece: 'q' | 'r' | 'b' | 'n' = 'q';
    if (this.rules.isPromotionMove(from, to)) {
      promotionPiece = (await this.uiManager.promptPawnPromotion()) as 'q' | 'r' | 'b' | 'n';
    }

    // Evaluate position before the player's move (in centipawns from White's perspective)
    const evalBefore = this.ai.evaluatePositionStatic(new Chess(this.rules.getFen()));

    const moveRes = this.rules.makeMove(from, to, promotionPiece);
    if (!moveRes) {
      this.isBusy = false;
      return;
    }

    // Evaluate position after the player's move to substantiate Brilliant Moves or Blunders
    const evalAfter = this.ai.evaluatePositionStatic(new Chess(moveRes.fenAfter));
    moveRes.evaluationDelta = evalAfter - evalBefore;

    // Animate player piece smoothly across the board before syncing matrix
    await this.board3D.animatePlayerMove(
      from,
      to,
      moveRes.flags,
      this.profile.settings.gameplay.animationSpeed
    );

    this.audioManager.playSfx(moveRes.captured ? 'capture' : 'move');
    if (moveRes.isCheck) this.audioManager.playSfx('check');

    this.board3D.syncPiecesFromMatrix(this.rules.getBoardMatrix());
    this.uiManager.updateTurnStatus(this.rules.getTurn(), moveRes.isCheck, this.rules.getHistory());

    // Direct ruler's gaze toward the square where the player moved
    this.uiManager.lookAtSquare(to);

    await this.persistCurrentMatchState();

    const playerEvent = this.classifyMoveEvent(moveRes, true);
    this.emitDialogue(playerEvent);

    if (await this.checkGameOverConditions(moveRes)) {
      this.isBusy = false;
      return;
    }

    await this.executeRivalTurn();
    this.isBusy = false;
  }

  private async executeRivalTurn(): Promise<void> {
    this.characterSystem.transitionTo('Thinking');

    const { move } = await this.ai.findBestMove(
      this.rules.getFen(),
      this.activeDifficulty,
      this.activeRealm.playStyle.aggressionWeight
    );

    const pieceMesh = this.board3D.getPieceMeshAt(move.from);
    const capturedMesh = move.captured ? this.board3D.getPieceMeshAt(move.to) : null;
    const fromWorld = this.board3D.squareToWorld(move.from);
    const toWorld = this.board3D.squareToWorld(move.to);

    // 1. Ejecutar primero la validación lógica en ChessRules
    const moveRes = this.rules.makeMove(move.from, move.to, (move.promotion as 'q') || 'q');
    if (!moveRes) return;

    // 2. Animar físicamente la mano del rival moviendo la pieza en 3D
    if (pieceMesh) {
      await this.rivalHand.executeRivalMoveSequence(
        fromWorld,
        toWorld,
        pieceMesh,
        capturedMesh,
        this.profile.settings.gameplay.animationSpeed,
        () => this.audioManager.playSfx('capture')
      );
    }

    if (!moveRes.captured) this.audioManager.playSfx('move');
    if (moveRes.isCheck) this.audioManager.playSfx('check');

    // 3. Sincronizar estado visual final del tablero (enroques, captura al paso, promociones)
    this.board3D.syncPiecesFromMatrix(this.rules.getBoardMatrix());
    this.uiManager.updateTurnStatus(this.rules.getTurn(), moveRes.isCheck, this.rules.getHistory());

    await this.persistCurrentMatchState();

    const aiEvent = this.classifyMoveEvent(moveRes, false);
    this.emitDialogue(aiEvent);

    await this.checkGameOverConditions(moveRes);
  }

  private classifyMoveEvent(move: MoveResult, isPlayerMove: boolean): GameEventType {
    if (move.isCheckmate) return isPlayerMove ? 'DEFEAT' : 'VICTORY';
    if (move.isDraw) return 'DRAW';
    if (move.isThreefoldRepetition) return 'REPETITION';
    if (move.isCheck) return isPlayerMove ? 'CHECK_RECEIVED' : 'CHECK_GIVEN';

    // Substantiated Engine Evaluation Checks (100 centipawns = 1 pawn)
    if (isPlayerMove && typeof move.evaluationDelta === 'number') {
      if (move.evaluationDelta <= -220) {
        return 'TACTICAL_BLUNDER'; // Player lost >= 2.2 pawns of evaluation
      }
      if (move.evaluationDelta >= 190 && !move.captured) {
        return 'BRILLIANT_MOVE'; // Quiet tactical move gaining >= 1.9 pawns
      }
    }

    if (move.captured === 'q') return isPlayerMove ? 'PIECE_LOST' : 'QUEEN_CAPTURE';
    if (move.promotion) return 'PROMOTION';
    if (move.flags.includes('k') || move.flags.includes('q')) return 'CASTLING';
    if (move.captured) return isPlayerMove ? 'PIECE_LOST' : 'CAPTURE';
    return 'NORMAL_MOVE';
  }

  private emitDialogue(event: GameEventType): void {
    this.characterSystem.applyEventImpact(event);
    const pool = this.activeRealm.dialogues[event] || this.activeRealm.dialogues.NORMAL_MOVE;
    const targetState = pool?.[0]?.state || 'Idle';

    this.characterSystem.transitionTo(targetState);
    this.uiManager.setBossAnimationState(targetState);
    this.bossThroneActor.setAnimationState(targetState);

    const line = this.dialogueSystem.triggerEventDialogue(this.activeRealm, event, {
      disableTaunts: this.profile.settings.accessibility.disableTaunts,
      showSubtitles: this.profile.settings.accessibility.showSubtitles,
    });
    if (line) {
      this.uiManager.showSpeechBubble(line.text, line.soundCue);
      this.bossThroneActor.triggerSpeechVocalization(Math.min(3200, Math.max(1200, line.text.length * 38)));
    }
  }

  private async checkGameOverConditions(lastMove: MoveResult): Promise<boolean> {
    if (!this.rules.isGameOver()) return false;

    if (lastMove.isCheckmate) {
      const playerWon = lastMove.color === 'w';
      await this.concludeMatch(
        playerWon ? 'victory' : 'defeat',
        playerWon ? `¡Has destronado a ${this.activeRealm.rivalName}!` : `${this.activeRealm.rivalName} te ha dado Jaque Mate.`
      );
      return true;
    }

    await this.concludeMatch('draw', 'Partida concluida en Tablas oficiales.');
    return true;
  }

  private async concludeMatch(outcome: 'victory' | 'defeat' | 'draw', message: string): Promise<void> {
    this.profile.activeMatch = null;
    if (outcome === 'victory') {
      this.profile.stats.wins++;
      this.profile.stats.bestResultByRealm[this.activeRealm.id] = 'victory';
      this.characterSystem.transitionTo('Defeat');

      // Desbloquear siguiente reino en la campaña
      const nextRealm = REALMS_CONFIG.find((r) => r.order === this.activeRealm.order + 1);
      if (nextRealm && !this.profile.unlockedRealms.includes(nextRealm.id)) {
        this.profile.unlockedRealms.push(nextRealm.id);
      }
    } else if (outcome === 'defeat') {
      this.profile.stats.losses++;
      if (this.profile.stats.bestResultByRealm[this.activeRealm.id] !== 'victory') {
        this.profile.stats.bestResultByRealm[this.activeRealm.id] = 'defeat';
      }
      this.characterSystem.transitionTo('Victory');
    } else {
      this.profile.stats.draws++;
    }

    await this.saveSystem.saveProfile(this.profile);
    this.uiManager.updateProfileData(this.profile);
    this.uiManager.showMatchEndBanner(outcome.toUpperCase(), message);
  }

  private async persistCurrentMatchState(): Promise<void> {
    this.profile.activeMatch = {
      realmId: this.activeRealm.id,
      fen: this.rules.getFen(),
      pgn: this.rules.getPgn(),
      difficulty: this.activeDifficulty,
      timestamp: Date.now(),
    };
    await this.saveSystem.saveProfile(this.profile);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.performanceManager.recordFrame(delta);
    this.sceneManager.update(delta, elapsed);
    this.bossThroneActor.update(delta, elapsed);
    this.board3D.update();
    this.postProcessing.render();
  };
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new TenThronesGame();
  game.bootstrap();
});
