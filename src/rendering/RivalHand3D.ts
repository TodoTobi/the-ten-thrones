// src/rendering/RivalHand3D.ts
import * as THREE from 'three';
import { RealmConfig } from '../core/types';
import { PostProcessingPipeline } from './PostProcessingPipeline';

export class RivalHand3D {
  private puppetRoot = new THREE.Group();
  private wristGroup = new THREE.Group();
  private fingerGroups: THREE.Group[] = [];
  private puppetStrings: THREE.Line[] = [];
  private commandAuraRing!: THREE.Mesh;

  private hoverRestPos = new THREE.Vector3(0, 6.8, -4.5);
  public onBossOrderGesture?: (active: boolean) => void;

  constructor(scene: THREE.Scene) {
    this.puppetRoot.visible = false;
    scene.add(this.puppetRoot);
  }

  public configureForRealm(realm: RealmConfig): void {
    while (this.puppetRoot.children.length > 0) {
      const child = this.puppetRoot.children[0];
      this.puppetRoot.remove(child);
    }
    this.wristGroup.clear();
    this.fingerGroups = [];
    this.puppetStrings = [];

    const { armorColor, ringColor, scale } = realm.handAppearance;

    const gauntletMat = new THREE.MeshStandardMaterial({
      color: armorColor,
      roughness: 0.25,
      metalness: 0.88,
    });
    const jointMat = new THREE.MeshStandardMaterial({
      color: realm.palette.secondary,
      roughness: 0.4,
      metalness: 0.6,
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });

    // 1. Dorso de la Mano de Títere Esculpido y Muñequera Real
    const palmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.24, 0.92), gauntletMat);
    palmMesh.castShadow = true;
    this.wristGroup.add(palmMesh);

    const cuffMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.65, 16), gauntletMat);
    cuffMesh.rotation.x = Math.PI / 2.2;
    cuffMesh.position.set(0, 0.22, -0.62);
    this.wristGroup.add(cuffMesh);

    // Sello rúnico flotante sobre el dorso de la mano de títere
    this.commandAuraRing = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.56, 6), glowMat);
    this.commandAuraRing.rotation.x = -Math.PI / 2;
    this.commandAuraRing.position.set(0, 0.35, -0.1);
    PostProcessingPipeline.markForSelectiveBloom(this.commandAuraRing);
    this.wristGroup.add(this.commandAuraRing);

    // 2. Cinco Dedos Articulados de Marioneta (con falanges y nudillos esféricos)
    for (let i = 0; i < 5; i++) {
      const fingerRoot = new THREE.Group();
      const isThumb = i === 0;
      if (isThumb) {
        fingerRoot.position.set(-0.48, -0.05, 0.18);
        fingerRoot.rotation.y = 0.45;
      } else {
        fingerRoot.position.set(-0.36 + (i - 1) * 0.24, -0.04, 0.46);
      }

      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), jointMat);
      const phalanx1 = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.38, 12), gauntletMat);
      phalanx1.rotation.x = Math.PI / 2.4;
      phalanx1.position.set(0, -0.12, 0.18);

      const phalanx2 = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.34, 12), gauntletMat);
      phalanx2.rotation.x = Math.PI / 1.8;
      phalanx2.position.set(0, -0.32, 0.34);

      fingerRoot.add(knuckle, phalanx1, phalanx2);
      this.fingerGroups.push(fingerRoot);
      this.wristGroup.add(fingerRoot);
    }

    // 3. Hilos de Títere Luminosos (conectan cada dedo y la muñeca con el cielo del salón)
    const stringMat = new THREE.LineBasicMaterial({
      color: realm.palette.primary,
      transparent: true,
      opacity: 0.85,
    });

    const stringAnchors = [
      new THREE.Vector3(0, 0.25, -0.4),     // Hilo maestro de la muñeca
      new THREE.Vector3(-0.36, 0, 0.65),    // Índice
      new THREE.Vector3(-0.12, 0, 0.68),    // Medio
      new THREE.Vector3(0.12, 0, 0.68),     // Anular
      new THREE.Vector3(0.36, 0, 0.65),     // Meñique
    ];

    stringAnchors.forEach((anchor) => {
      const pts = [anchor, new THREE.Vector3(anchor.x * 1.4, 14.0, anchor.z - 2.2)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(lineGeo, stringMat);
      PostProcessingPipeline.markForSelectiveBloom(line);
      this.puppetStrings.push(line);
      this.wristGroup.add(line);
    });

    this.wristGroup.scale.setScalar(scale);
    this.puppetRoot.add(this.wristGroup);
  }

  public async executeRivalMoveSequence(
    fromWorld: THREE.Vector3,
    toWorld: THREE.Vector3,
    pieceMesh: THREE.Object3D,
    capturedMesh: THREE.Object3D | null,
    speedMultiplier = 1.0,
    onCaptureMoment?: () => void
  ): Promise<void> {
    // 1. El Jefe en el trono levanta su brazo dando la orden imperial
    this.onBossOrderGesture?.(true);
    await new Promise((r) => setTimeout(r, 260 / speedMultiplier));

    this.puppetRoot.visible = true;
    const grabOffset = new THREE.Vector3(0, 1.18, -0.15);
    const hoverFrom = fromWorld.clone().add(grabOffset);
    const hoverTo = toWorld.clone().add(grabOffset);

    // 2. La Mano de Títere desciende colgada de sus hilos hacia la pieza
    await this.tweenVector(this.hoverRestPos, hoverFrom, 440 / speedMultiplier, (pos, t) => {
      this.wristGroup.position.copy(pos);
      this.wristGroup.rotation.z = Math.sin(t * Math.PI) * 0.08; // Balanceo de marioneta
      this.commandAuraRing.rotation.z += 0.08;
    });

    // 3. Cierra las falanges articuladas sobre la pieza
    this.setPuppetGrip(true);
    await new Promise((r) => setTimeout(r, 95 / speedMultiplier));

    // 4. Eleva y transporta la pieza obedeciendo la orden del Gobernante
    await this.tweenProgress(540 / speedMultiplier, (t) => {
      const currentPiece = new THREE.Vector3().lerpVectors(fromWorld, toWorld, t);
      currentPiece.y += Math.sin(t * Math.PI) * 1.15;

      pieceMesh.position.copy(currentPiece);
      this.wristGroup.position.copy(currentPiece).add(grabOffset);
      this.wristGroup.rotation.x = Math.sin(t * Math.PI) * 0.14;
      this.commandAuraRing.rotation.z += 0.1;

      if (t >= 0.75 && capturedMesh && capturedMesh.visible) {
        capturedMesh.visible = false;
        onCaptureMoment?.();
      }
    });

    // 5. Suelta la pieza y el Jefe baja el brazo en el trono
    pieceMesh.position.copy(toWorld);
    this.setPuppetGrip(false);
    this.onBossOrderGesture?.(false);
    await new Promise((r) => setTimeout(r, 85 / speedMultiplier));

    // 6. La Mano de Títere asciende de regreso hacia las sombras
    await this.tweenVector(hoverTo, this.hoverRestPos, 380 / speedMultiplier, (pos) => {
      this.wristGroup.position.copy(pos);
    });

    this.puppetRoot.visible = false;
  }

  private setPuppetGrip(closed: boolean): void {
    const angle = closed ? 0.52 : 0.0;
    this.fingerGroups.forEach((fg, idx) => {
      if (idx === 0) fg.rotation.z = closed ? -0.45 : 0;
      else fg.rotation.x = angle;
    });
  }

  private tweenVector(
    from: THREE.Vector3,
    to: THREE.Vector3,
    durationMs: number,
    onUpdate: (v: THREE.Vector3, t: number) => void
  ): Promise<void> {
    return this.tweenProgress(durationMs, (t) => {
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      onUpdate(new THREE.Vector3().lerpVectors(from, to, eased), t);
    });
  }

  private tweenProgress(durationMs: number, onTick: (t: number) => void): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / Math.max(16, durationMs));
        onTick(t);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }
}
