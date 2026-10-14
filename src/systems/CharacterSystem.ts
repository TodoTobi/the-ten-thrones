// src/systems/CharacterSystem.ts

import { CharacterAnimationState, EmotionalState, GameEventType, RealmConfig } from '../core/types';



export class CharacterSystem {

  private currentState: CharacterAnimationState = 'Idle';

  private emotions: EmotionalState;

  private returnTimer: number | null = null;

  private containerEl: HTMLElement | null;



  constructor(realm: RealmConfig, containerSelector = '#rival-portrait-stage') {

    this.emotions = { ...realm.baseEmotions };

    this.containerEl = typeof document !== 'undefined' ? document.querySelector(containerSelector) : null;

    this.renderState();

  }



  public resetForRealm(realm: RealmConfig): void {

    this.emotions = { ...realm.baseEmotions };

    this.transitionTo('Idle');

  }



  public applyEventImpact(event: GameEventType): void {

    const clamp = (val: number) => Math.max(0, Math.min(100, val));



    switch (event) {

      case 'CAPTURE':

      case 'QUEEN_CAPTURE':

        this.emotions.confidence = clamp(this.emotions.confidence + 8);

        this.emotions.frustration = clamp(this.emotions.frustration - 5);

        break;

      case 'PIECE_LOST':

        this.emotions.frustration = clamp(this.emotions.frustration + 12);

        this.emotions.confidence = clamp(this.emotions.confidence - 6);

        break;

      case 'BRILLIANT_MOVE':

        this.emotions.surprise = clamp(this.emotions.surprise + 25);

        this.emotions.respect = clamp(this.emotions.respect + 15);

        break;

      case 'TACTICAL_BLUNDER':

        this.emotions.tauntIntensity = clamp(this.emotions.tauntIntensity + 18);

        this.emotions.confidence = clamp(this.emotions.confidence + 10);

        break;

      case 'CHECK_RECEIVED':

        this.emotions.frustration = clamp(this.emotions.frustration + 10);

        break;

    }

  }



  public transitionTo(state: CharacterAnimationState, durationMs = 2800): void {

    if (this.returnTimer) window.clearTimeout(this.returnTimer);

    this.currentState = state;

    this.renderState();



    if (state !== 'Idle' && state !== 'Victory' && state !== 'Defeat' && state !== 'Checkmate') {

      this.returnTimer = window.setTimeout(() => {

        this.currentState = 'Idle';

        this.renderState();

      }, durationMs);

    }

  }



  public getState(): CharacterAnimationState {

    return this.currentState;

  }



  public getEmotions(): EmotionalState {

    return { ...this.emotions };

  }



  private renderState(): void {

    if (!this.containerEl) return;

    this.containerEl.setAttribute('data-anim-state', this.currentState);

  }

}
