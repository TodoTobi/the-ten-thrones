// src/rendering/BossIntroDirector.ts
import * as THREE from 'three';
import { RealmConfig } from '../core/types';
import { AnimeBossThroneActor } from './AnimeBossThroneActor';

export class BossIntroDirector {
  private isSkipping = false;

  public async playBossIntroCutscene(
    camera: THREE.PerspectiveCamera,
    bossActor: AnimeBossThroneActor,
    realm: RealmConfig,
    onCompleteRestoreView: () => void
  ): Promise<void> {
    this.isSkipping = false;

    const overlay = document.getElementById('boss-intro-cutscene-overlay');
    const titleEl = document.getElementById('cutscene-boss-name');
    const subEl = document.getElementById('cutscene-boss-title');
    const quoteEl = document.getElementById('cutscene-boss-quote');

    if (titleEl) titleEl.textContent = realm.rivalName.toUpperCase();
    if (subEl) subEl.textContent = `${realm.rivalTitle} — ${realm.name}`;
    if (quoteEl) quoteEl.textContent = `«${realm.dialogues.GAME_START[0]?.text || ''}»`;
    overlay?.classList.remove('hidden');

    const skipHandler = () => {
      this.isSkipping = true;
    };
    window.addEventListener('keydown', skipHandler, { once: true });
    overlay?.addEventListener('click', skipHandler, { once: true });

    // PLANO 1: Barrido rasante sobre las piezas del tablero hacia el trono (1.5s)
    await this.animateCameraShot(
      camera,
      new THREE.Vector3(0, 1.3, 6.8),
      new THREE.Vector3(0, 2.2, 1.5),
      new THREE.Vector3(0, 2.4, -7.6),
      new THREE.Vector3(0, 2.8, -7.6),
      1500
    );

    // PLANO 2: Contrapicado intimidante frente al Jefe en su trono + gesto de orden (2.0s)
    bossActor.setAnimationState('Confident');
    bossActor.setPuppetCommandGesture(true);
    await this.animateCameraShot(
      camera,
      new THREE.Vector3(-1.4, 2.2, -3.2),
      new THREE.Vector3(0.6, 2.7, -2.6),
      new THREE.Vector3(0, 3.25, -7.65),
      new THREE.Vector3(0, 3.35, -7.65),
      2000
    );
    bossActor.setPuppetCommandGesture(false);

    // PLANO 3: Retorno cinematográfico a la posición de Duelo (1.1s)
    await this.animateCameraShot(
      camera,
      new THREE.Vector3(0.6, 2.7, -2.6),
      new THREE.Vector3(0, 6.8, 9.5),
      new THREE.Vector3(0, 3.35, -7.65),
      new THREE.Vector3(0, 0.8, -2.2),
      1100
    );

    overlay?.classList.add('hidden');
    window.removeEventListener('keydown', skipHandler);
    onCompleteRestoreView();
  }

  private animateCameraShot(
    camera: THREE.PerspectiveCamera,
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3,
    fromLook: THREE.Vector3,
    toLook: THREE.Vector3,
    durationMs: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (this.isSkipping) return resolve();
      const start = performance.now();
      const currentLook = new THREE.Vector3();

      const step = (now: number) => {
        if (this.isSkipping) return resolve();
        const t = Math.min(1, (now - start) / durationMs);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        camera.position.lerpVectors(fromPos, toPos, eased);
        currentLook.lerpVectors(fromLook, toLook, eased);
        camera.lookAt(currentLook);

        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }
}
