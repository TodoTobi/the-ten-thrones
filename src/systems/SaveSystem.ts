// src/systems/SaveSystem.ts

import { GAME_CONFIG } from '../config/game.config';

import { GameSettings } from '../core/types';



export interface SaveProfileData {

  unlockedRealms: string[];

  activeMatch: {

    realmId: string;

    fen: string;

    pgn: string;

    difficulty: string;

    timestamp: number;

  } | null;

  stats: {

    wins: number;

    losses: number;

    draws: number;

    bestResultByRealm: Record<string, 'victory' | 'draw' | 'defeat'>;

  };

  settings: GameSettings;

}



export class SaveSystem {

  private db: IDBDatabase | null = null;



  public async init(): Promise<void> {

    if (typeof indexedDB === 'undefined') return;

    return new Promise((resolve, reject) => {

      const req = indexedDB.open(GAME_CONFIG.DB_NAME, GAME_CONFIG.DB_VERSION);

      req.onupgradeneeded = () => {

        const db = req.result;

        if (!db.objectStoreNames.contains('profile')) {

          db.createObjectStore('profile');

        }

      };

      req.onsuccess = () => {

        this.db = req.result;

        resolve();

      };

      req.onerror = () => reject(req.error);

    });

  }



  public async loadProfile(): Promise<SaveProfileData> {

    const fallback = this.getDefaultProfile();

    if (!this.db) return fallback;



    return new Promise((resolve) => {

      const tx = this.db!.transaction('profile', 'readonly');

      const store = tx.objectStore('profile');

      const req = store.get('main_slot');

      req.onsuccess = () => resolve(req.result ? { ...fallback, ...req.result } : fallback);

      req.onerror = () => resolve(fallback);

    });

  }



  public async saveProfile(data: SaveProfileData): Promise<void> {

    if (!this.db) return;

    return new Promise((resolve, reject) => {

      const tx = this.db!.transaction('profile', 'readwrite');

      const store = tx.objectStore('profile');

      const req = store.put(data, 'main_slot');

      req.onsuccess = () => resolve();

      req.onerror = () => reject(req.error);

    });

  }



  public getDefaultProfile(): SaveProfileData {

    return {

      unlockedRealms: ['eternal_crown'],

      activeMatch: null,

      stats: { wins: 0, losses: 0, draws: 0, bestResultByRealm: {} },

      settings: {

        graphics: { quality: 'high', shadows: true, particles: true, antialiasing: true, renderScale: 1, cinematicAnimations: true },

        audio: { master: 0.85, music: 0.7, sfx: 0.8, voice: 0.9, muted: false },

        gameplay: { defaultDifficulty: 'intermediate', showLegalMoves: true, confirmMoves: false, animationSpeed: 1.0, boardOrientation: 'w' },

        accessibility: { uiScale: 1.0, highContrast: false, reducedMotion: false, disableTaunts: false, showSubtitles: true },

      },

    };

  }

}
