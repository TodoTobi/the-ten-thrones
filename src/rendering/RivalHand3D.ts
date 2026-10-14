// src/rendering/RivalHand3D.ts
import * as THREE from 'three';
import { RealmConfig } from '../core/types';
import { PostProcessingPipeline } from './PostProcessingPipeline';

export class RivalHand3D {
  private armRoot: THREE.Group;
  private upperArmMesh!: THREE.Mesh;
  private elbowJointMesh!: THREE.Mesh;
  private forearmMesh!: THREE.Mesh;
  private handWristGroup = new THREE.Group();
  private fingers: THREE.Mesh[] = [];

  // Punto de anclaje anatómico en el hombro derecho del trono
  private shoulderAnchor = new THREE.Vector3(2.1, 3.9, -7.4);
  // Posición de reposo sobre el apoyabrazos derecho del trono
  private armrestPosition = new THREE.Vector3(1.9, 1.35, -6.2);

  constructor(scene: THREE.Scene) {
    this.armRoot = new THREE.Group();
    this.armRoot.visible = false;
    scene.add(this.armRoot);
  }

  public configureForRealm(realm: RealmConfig): void {
    while (this.armRoot.children.length > 0) {
      const child = this.armRoot.children[0] as THREE.Mesh;
      child.geometry?.dispose();
      this.armRoot.remove(child);
    }
    this.handWristGroup.clear();
    this.fingers = [];

    const { skinColor, armorColor, ringColor, scale } = realm.handAppearance;

    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.55, metalness: 0.1 });
    const armorMat = new THREE.MeshStandardMaterial({ color: armorColor, roughness: 0.28, metalness: 0.82 });
    const ringMat = new THREE.MeshStandardMaterial({
      color: ringColor,
      roughness: 0.15,
      metalness: 0.9,
      emissive: ringColor,
      emissiveIntensity: 0.35,
    });

    // 1. Brazo Superior (Hombro a Codo) y Codera
    const limbGeo = new THREE.CylinderGeometry(0.32, 0.26, 1, 16);
    limbGeo.rotateX(Math.PI / 2);
    this.upperArmMesh = new THREE.Mesh(limbGeo, armorMat);
    this.upperArmMesh.castShadow = true;

    this.elbowJointMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), armorMat);
    this.elbowJointMesh.castShadow = true;

    // 2. Antebrazo Acorazado (Codo a Muñeca)
    this.forearmMesh = new THREE.Mesh(limbGeo.clone(), armorMat);
    this.forearmMesh.castShadow = true;

    // 3. Mano Anatómica y Dedos Articulados
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.26, 0.82), skinMat);
    palm.castShadow = true;
    this.handWristGroup.add(palm);

    for (let i = 0; i < 4; i++) {
      const fingerGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.58, 12);
      fingerGeo.rotateX(Math.PI / 2.3);
      const finger = new THREE.Mesh(fingerGeo, skinMat);
      finger.position.set(-0.27 + i * 0.18, -0.12, 0.48);
      finger.castShadow = true;
      this.fingers.push(finger);
      this.handWristGroup.add(finger);
    }

    // Pulgar oponible
    const thumbGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.46, 10);
    thumbGeo.rotateZ(-Math.PI / 4);
    const thumb = new THREE.Mesh(thumbGeo, skinMat);
    thumb.position.set(-0.42, -0.1, 0.2);
    this.fingers.push(thumb);
    this.handWristGroup.add(thumb);

    // Anillo real emisivo
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.03, 10, 20), ringMat);
    ring.position.set(0.09, -0.04, 0.36);
    PostProcessingPipeline.markForSelectiveBloom(ring);
    this.handWristGroup.add(ring);
    this.handWristGroup.scale.setScalar(scale);

    this.armRoot.add(this.upperArmMesh, this.elbowJointMesh, this.forearmMesh, this.handWristGroup);
    this.solveArmIK(this.armrestPosition);
  }

  /**
   * Calcula la posición anatómica del codo y orienta el brazo superior y el antebrazo
   * desde el hombro del gobernante hasta la posición actual de la mano.
   */
  private solveArmIK(wristPos: THREE.Vector3): void {
    this.handWristGroup.position.copy(wristPos);

    // El codo se curva ligeramente hacia afuera y arriba para no atravesar las piezas del tablero
    const midPoint = new THREE.Vector3().lerpVectors(this.shoulderAnchor, wristPos, 0.48);
    const elbowPos = midPoint.add(new THREE.Vector3(1.15, 0.65, -0.4));

    this.elbowJointMesh.position.copy(elbowPos);

    // Orientar y escalar Húmero (Hombro -> Codo)
    const upperDist = this.shoulderAnchor.distanceTo(elbowPos);
    this.upperArmMesh.position.lerpVectors(this.shoulderAnchor, elbowPos, 0.5);
    this.upperArmMesh.scale.set(1, 1, upperDist);
    this.upperArmMesh.lookAt(elbowPos);

    // Orientar y escalar Antebrazo (Codo -> Muñeca)
    const foreDist = elbowPos.distanceTo(wristPos);
    this.forearmMesh.position.lerpVectors(elbowPos, wristPos, 0.5);
    this.forearmMesh.scale.set(1, 1, foreDist);
    this.forearmMesh.lookAt(wristPos);
  }

  public async executeRivalMoveSequence(
    fromWorld: THREE.Vector3,
    toWorld: THREE.Vector3,
    pieceMesh: THREE.Object3D,
    capturedMesh: THREE.Object3D | null,
    speedMultiplier = 1.0,
    onCaptureMoment?: () => void
  ): Promise<void> {
    this.armRoot.visible = true;
    const grabOffset = new THREE.Vector3(0, 1.15, -0.15);
    const hoverFrom = fromWorld.clone().add(grabOffset);
    const hoverTo = toWorld.clone().add(grabOffset);

    // 1. Preparar brazo y extender desde el apoyabrazos hacia la pieza
    await this.tweenVector(this.armrestPosition, hoverFrom, 440 / speedMultiplier, (pos) => {
      this.solveArmIK(pos);
    });

    // 2. Cerrar dedos sobre la pieza
    this.setGrip(true);
    await new Promise((r) => setTimeout(r, 85 / speedMultiplier));

    // 3. Elevar y desplazar pieza manteniendo toda la cadena Hombro-Codo-Mano conectada
    await this.tweenProgress(540 / speedMultiplier, (t) => {
      const currentPiece = new THREE.Vector3().lerpVectors(fromWorld, toWorld, t);
      currentPiece.y += Math.sin(t * Math.PI) * 1.1;

      pieceMesh.position.copy(currentPiece);
      this.solveArmIK(currentPiece.clone().add(grabOffset));

      if (t >= 0.75 && capturedMesh && capturedMesh.visible) {
        capturedMesh.visible = false;
        onCaptureMoment?.();
      }
    });

    // 4. Depositar pieza y abrir dedos
    pieceMesh.position.copy(toWorld);
    this.setGrip(false);
    await new Promise((r) => setTimeout(r, 80 / speedMultiplier));

    // 5. Retirar brazo hacia el apoyabrazos del trono
    await this.tweenVector(hoverTo, this.armrestPosition, 390 / speedMultiplier, (pos) => {
      this.solveArmIK(pos);
    });

    this.armRoot.visible = false;
  }

  private setGrip(closed: boolean): void {
    const rot = closed ? 0.48 : 0;
    this.fingers.forEach((f) => {
      f.rotation.x = rot;
    });
  }

  private tweenVector(
    from: THREE.Vector3,
    to: THREE.Vector3,
    durationMs: number,
    onUpdate: (v: THREE.Vector3) => void
  ): Promise<void> {
    return this.tweenProgress(durationMs, (t) => {
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      onUpdate(new THREE.Vector3().lerpVectors(from, to, eased));
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
