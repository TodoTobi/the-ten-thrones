// src/systems/DialogueSystem.ts

import { GameEventType, RealmConfig } from '../core/types';



export class DialogueSystem {

  private lastSpokenTimestamp = 0;

  private cooldownMs = 2200;

  private recentLines = new Set<string>();



  public triggerEventDialogue(

    realm: RealmConfig,

    event: GameEventType,

    options: { disableTaunts: boolean; showSubtitles: boolean }

  ): { text: string; soundCue: string } | null {

    const now = performance.now();

    const isCritical = ['GAME_START', 'CHECK_GIVEN', 'CHECK_RECEIVED', 'QUEEN_CAPTURE', 'VICTORY', 'DEFEAT'].includes(event);



    if (!isCritical && now - this.lastSpokenTimestamp < this.cooldownMs) {

      return null;

    }



    if (options.disableTaunts && event === 'TACTICAL_BLUNDER') {

      return null;

    }



    const pool = realm.dialogues[event] || realm.dialogues.NORMAL_MOVE;

    if (!pool || pool.length === 0) return null;



    const available = pool.filter((item) => !this.recentLines.has(item.text));

    const chosen = (available.length > 0 ? available : pool)[

      Math.floor(Math.random() * (available.length > 0 ? available.length : pool.length))

    ];



    this.recentLines.add(chosen.text);

    if (this.recentLines.size > 8) {

      const first = this.recentLines.values().next().value;

      if (first) this.recentLines.delete(first);

    }



    this.lastSpokenTimestamp = now;

    return { text: chosen.text, soundCue: chosen.soundCue };

  }

}
