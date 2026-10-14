import { AssetLoader } from './AssetLoader';
import { PostProcessingPipeline } from './PostProcessingPipeline';
// src/rendering/SceneManager.ts

import * as THREE from 'three';

import { RealmConfig } from '../core/types';



export class SceneManager {

  private scene: THREE.Scene;

  private environmentGroup = new THREE.Group();

  private ambientLight: THREE.AmbientLight;

  private mainLight: THREE.DirectionalLight;

  private pointLights: THREE.PointLight[] = [];

  private particleSystem: THREE.Points | null = null;

  private floatingObjects: THREE.Object3D[] = [];

  private activeParticleType: string = 'dust';



  constructor(scene: THREE.Scene) {

    this.scene = scene;

    this.scene.add(this.environmentGroup);



    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.55);

    this.scene.add(this.ambientLight);



    this.mainLight = new THREE.DirectionalLight(0xffffff, 1.8);

    this.mainLight.position.set(6, 12, 8);

    this.mainLight.castShadow = true;

    this.mainLight.shadow.mapSize.width = 2048;

    this.mainLight.shadow.mapSize.height = 2048;

    this.mainLight.shadow.camera.near = 1;

    this.mainLight.shadow.camera.far = 35;

    this.scene.add(this.mainLight);

  }



  public loadRealmEnvironment(realm: RealmConfig, enableParticles = true): void {

    this.disposeCurrentEnvironment();



    // 1. Niebla e iluminación del reino

    this.scene.background = new THREE.Color(realm.palette.fogColor);

    this.scene.fog = new THREE.FogExp2(realm.palette.fogColor, realm.palette.fogDensity);



    this.ambientLight.color.setHex(realm.palette.ambientLight);

    this.mainLight.color.setHex(realm.palette.directionalLight);



    // 2. Mesa monumental y pedestal bajo el tablero

    const pedestalMat = new THREE.MeshStandardMaterial({

      color: realm.palette.secondary,

      roughness: 0.45,

      metalness: 0.35,

    });

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.6, 11.5), pedestalMat);

    tableTop.position.y = -0.6;

    tableTop.receiveShadow = true;

    this.environmentGroup.add(tableTop);



    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.6, 6, 16), pedestalMat);

    pillar.position.y = -3.8;

    this.environmentGroup.add(pillar);



    // 3. El Trono del Rival al fondo (z = -8.5)

    this.buildThroneForRealm(realm);



    // 4. Arquitectura perimetral diferenciada por reino

    this.buildRealmArchitecture(realm);



    // 5. Sistemas de partículas ambientales

    if (enableParticles && realm.ambientElements.length > 0) {

      this.activeParticleType = realm.ambientElements[0];

      this.buildParticleSystem(realm);

    }

  }



  private buildThroneForRealm(realm: RealmConfig): void {

        // Intentar cargar modelo GLB del trono si existe
    const customThrone = AssetLoader.getInstance().getClonedThroneSync(realm.id);
    if (customThrone) {
      customThrone.position.set(0, -0.5, -8.2);
      this.environmentGroup.add(customThrone);
      return;
    }

    const throneGroup = new THREE.Group();

    throneGroup.position.set(0, -0.5, -8.2);



    const primaryMat = new THREE.MeshStandardMaterial({

      color: realm.palette.primary,

      roughness: 0.3,

      metalness: 0.7,

    });

    const darkMat = new THREE.MeshStandardMaterial({

      color: realm.palette.secondary,

      roughness: 0.5,

      metalness: 0.3,

    });



    // Respaldo monumental

    const backHeight = realm.id === 'void_throne' ? 7.5 : 6.2;

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(3.8, backHeight, 0.5), darkMat);

    backrest.position.y = backHeight / 2;

    backrest.castShadow = true;

    throneGroup.add(backrest);



    // Molduras / Corona del trono

    const crest = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.8, 5), primaryMat);

    crest.position.set(0, backHeight + 0.6, 0);

    throneGroup.add(crest);



    // Reposabrazos donde se apoya la presencia del rival

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 2.6), primaryMat);

    leftArm.position.set(-1.9, 1.2, 1.0);

    const rightArm = leftArm.clone();

    rightArm.position.x = 1.9;

    throneGroup.add(leftArm, rightArm);



    // Luces de acento flanqueando el trono

    const leftTorch = new THREE.PointLight(realm.palette.accent, 3.5, 16);

    leftTorch.position.set(-4.5, 3.5, -6.5);

    const rightTorch = new THREE.PointLight(realm.palette.accent, 3.5, 16);

    rightTorch.position.set(4.5, 3.5, -6.5);

    this.environmentGroup.add(leftTorch, rightTorch);

    this.pointLights.push(leftTorch, rightTorch);



    this.environmentGroup.add(throneGroup);

  }



  private buildRealmArchitecture(realm: RealmConfig): void {
    const archMat = new THREE.MeshStandardMaterial({
      color: realm.palette.secondary,
      roughness: 0.5,
      metalness: 0.35,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: realm.palette.accent,
      emissive: realm.palette.accent,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
    });

    // GPU-Instanced Perimeter Pillars (12 columns in 1 single draw call)
    const columnCount = 12;
    const colGeo =
      realm.id === 'elven_throne'
        ? new THREE.CylinderGeometry(0.35, 0.95, 16, 7)
        : realm.id === 'void_throne'
        ? new THREE.OctahedronGeometry(1.35, 0)
        : new THREE.CylinderGeometry(0.8, 1.05, 16, 12);

    const instancedColumns = new THREE.InstancedMesh(colGeo, archMat, columnCount);
    instancedColumns.castShadow = true;
    instancedColumns.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < columnCount; i++) {
      const angle = (i / columnCount) * Math.PI * 1.5 - Math.PI * 1.25;
      const radius = i % 2 === 0 ? 14.0 : 18.5; // Midground & background depth layers
      dummy.position.set(Math.cos(angle) * radius, 3.5, Math.sin(angle) * radius);
      dummy.rotation.y = -angle;
      dummy.updateMatrix();
      instancedColumns.setMatrixAt(i, dummy.matrix);
    }
    this.environmentGroup.add(instancedColumns);

    // Realm-Specific Signature Landmarks
    switch (realm.id) {
      case 'eternal_crown': {
        // Monumental Gothic Stained Glass Window behind the Throne
        const customWindow = AssetLoader.getInstance().getClonedEnvSync('stained_glass_window');
        if (customWindow) {
          customWindow.position.set(0, 1.0, -12.5);
          customWindow.scale.set(1.2, 1.2, 1.2);
          PostProcessingPipeline.markForSelectiveBloom(customWindow);
          this.environmentGroup.add(customWindow);
        } else {
          const roseFrame = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.4, 24), accentMat);
          roseFrame.position.set(0, 6.8, -12.5);
          PostProcessingPipeline.markForSelectiveBloom(roseFrame);
          this.environmentGroup.add(roseFrame);
        }

        // Royal Banners flanking the Throne Room
        for (const side of [-5.2, 5.2]) {
          const banner = AssetLoader.getInstance().getClonedEnvSync('royal_banner');
          if (banner) {
            banner.position.set(side, 3.2, -8.2);
            banner.scale.set(1.1, 1.1, 1.1);
            if (side > 0) banner.rotation.y = Math.PI;
            this.environmentGroup.add(banner);
          }
        }

        // Braziers flanking the Throne
        for (const side of [-4.5, 4.5]) {
          const brazier = AssetLoader.getInstance().getClonedEnvSync('brazier_torch');
          if (brazier) {
            brazier.position.set(side, -0.5, -6.5);
            brazier.scale.set(0.9, 0.9, 0.9);
            this.environmentGroup.add(brazier);
          }
        }

        // Stone Balustrades framing the foreground/midground arena
        for (const side of [-7.6, 7.6]) {
          const barrier = AssetLoader.getInstance().getClonedEnvSync('stone_barrier');
          if (barrier) {
            barrier.position.set(side, -0.5, -1.0);
            barrier.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
            this.environmentGroup.add(barrier);
          }
        }
        break;
      }
      case 'shadow_court': {
        const roseFrame = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.4, 24), accentMat);
        roseFrame.position.set(0, 6.8, -12.5);
        PostProcessingPipeline.markForSelectiveBloom(roseFrame);
        this.environmentGroup.add(roseFrame);
        break;
      }
      case 'iron_bastion': {
        // Rotating Dwarven Forge Cogs & Molten Crucible
        const cog = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.35, 8, 12), accentMat);
        cog.position.set(0, 5.5, -12.0);
        PostProcessingPipeline.markForSelectiveBloom(cog);
        this.environmentGroup.add(cog);
        this.floatingObjects.push(cog);
        break;
      }
      case 'draconic_empire':
      case 'ash_throne': {
        // Jagged Volcanic Obsidian Rib Arches
        for (let side of [-1, 1]) {
          const fang = new THREE.Mesh(new THREE.ConeGeometry(1.2, 9.5, 5), archMat);
          fang.position.set(side * 7.5, 2.5, -9.5);
          fang.rotation.z = side * 0.38;
          this.environmentGroup.add(fang);
        }
        break;
      }
      case 'celestial_sanctuary':
      case 'void_throne': {
        // Concentric Gyroscopic Astrolabe Rings behind the Ruler
        for (let r = 0; r < 3; r++) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2 + r * 1.1, 0.07, 10, 48), accentMat);
          ring.position.set(0, 4.8, -11.5);
          ring.rotation.set(r * 0.5, r * 0.8, 0);
          PostProcessingPipeline.markForSelectiveBloom(ring);
          this.environmentGroup.add(ring);
          this.floatingObjects.push(ring);
        }
        break;
      }
    }
  }



  private buildParticleSystem(realm: RealmConfig): void {

    const count = 220;

    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {

      positions[i * 3] = (Math.random() - 0.5) * 24;

      positions[i * 3 + 1] = Math.random() * 12 - 1;

      positions[i * 3 + 2] = (Math.random() - 0.5) * 24;

    }



    const geo = new THREE.BufferGeometry();

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));



    const mat = new THREE.PointsMaterial({

      color: realm.palette.accent,

      size: this.activeParticleType === 'snow' ? 0.14 : 0.1,

      transparent: true,

      opacity: 0.75,

    });



    this.particleSystem = new THREE.Points(geo, mat);

    PostProcessingPipeline.markForSelectiveBloom(this.particleSystem);
    this.environmentGroup.add(this.particleSystem);

  }



  public update(deltaSec: number, elapsedSec: number): void {

    // Animación de objetos flotantes (cristales, runas, fragmentos del vacío)

    this.floatingObjects.forEach((obj, idx) => {

      obj.rotation.y += deltaSec * 0.45;

      obj.position.y += Math.sin(elapsedSec * 1.5 + idx) * 0.004;

    });



    // Animación de partículas según el bioma del reino

    if (this.particleSystem) {

      const posAttr = this.particleSystem.geometry.getAttribute('position') as THREE.BufferAttribute;

      const speedY = this.activeParticleType === 'snow' || this.activeParticleType === 'leaves' ? -1.4 : 0.9;



      for (let i = 0; i < posAttr.count; i++) {

        let y = posAttr.getY(i) + speedY * deltaSec;

        if (y > 11) y = -1;

        if (y < -1) y = 11;

        posAttr.setY(i, y);

      }

      posAttr.needsUpdate = true;

    }

  }



  public disposeCurrentEnvironment(): void {

    this.floatingObjects = [];

    this.pointLights = [];

    this.particleSystem = null;



    while (this.environmentGroup.children.length > 0) {

      const obj = this.environmentGroup.children[0] as THREE.Mesh;

      obj.geometry?.dispose();

      if (Array.isArray(obj.material)) {

        obj.material.forEach((m) => m.dispose());

      } else {

        obj.material?.dispose();

      }

      this.environmentGroup.remove(obj);

    }

  }

  public configureBloomForRealm(realm: RealmConfig, postProcessing: PostProcessingPipeline): void {
    const highMagicRealms = ['elven_throne', 'draconic_empire', 'celestial_sanctuary', 'void_throne'];
    const strength = highMagicRealms.includes(realm.id) ? 1.35 : 0.85;
    postProcessing.setBloomParameters(strength, 0.45, 0.15);
  }

}
