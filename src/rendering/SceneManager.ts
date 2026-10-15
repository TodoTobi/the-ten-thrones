// src/rendering/SceneManager.ts
import * as THREE from 'three';
import { RealmConfig } from '../core/types';
import { AssetLoader } from './AssetLoader';
import { PostProcessingPipeline } from './PostProcessingPipeline';

export class SceneManager {
  private scene: THREE.Scene;
  private renderer?: THREE.WebGLRenderer;
  private environmentGroup = new THREE.Group();

  // Sistema de iluminación cinematográfica multicapa (Key, Fill, Rim, Hemisphere)
  private ambientLight: THREE.AmbientLight;
  private hemisphereLight: THREE.HemisphereLight;
  private mainLight: THREE.DirectionalLight; // Key Light cálido con sombras suaves PCF
  private fillLight: THREE.DirectionalLight; // Fill Light complementario azul/violeta profundo
  private rimLight: THREE.DirectionalLight;  // Rim Light dorado para siluetas de alta definición
  private pointLights: THREE.PointLight[] = [];

  // Mapa de reflexión HDR/PMREM de estudio asignado a scene.environment
  private envMapTexture: THREE.Texture | null = null;

  private particleSystem: THREE.Points | null = null;
  private floatingObjects: THREE.Object3D[] = [];
  private activeParticleType: string = 'dust';

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.scene.add(this.environmentGroup);

    // 1. Luz de base ambiental sutil
    this.ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.35);
    this.scene.add(this.ambientLight);

    // 2. Luz de relleno hemisférica azul/violeta profundo: las sombras adquieren riqueza cromática sin embarrarse
    this.hemisphereLight = new THREE.HemisphereLight(0x38325a, 0x111322, 0.95);
    this.scene.add(this.hemisphereLight);

    // 3. Key Light principal cálido con proyección de sombras suaves PCF
    this.mainLight = new THREE.DirectionalLight(0xfff3df, 2.5);
    this.mainLight.position.set(6.5, 14.0, 7.5);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 2048;
    this.mainLight.shadow.mapSize.height = 2048;
    this.mainLight.shadow.camera.near = 1;
    this.mainLight.shadow.camera.far = 40;
    this.mainLight.shadow.camera.left = -7.5;
    this.mainLight.shadow.camera.right = 7.5;
    this.mainLight.shadow.camera.top = 7.5;
    this.mainLight.shadow.camera.bottom = -7.5;
    this.mainLight.shadow.bias = -0.0003;
    this.mainLight.shadow.normalBias = 0.02;
    this.mainLight.shadow.radius = 2.0;
    this.scene.add(this.mainLight);

    // 4. Fill Light angular complementario (cobalto/violeta) desde el flanco opuesto
    this.fillLight = new THREE.DirectionalLight(0x7080b0, 0.85);
    this.fillLight.position.set(-7.5, 9.0, 5.0);
    this.fillLight.castShadow = false;
    this.scene.add(this.fillLight);

    // 5. Rim / Backlight dorado afilado para despegar las piezas y el trono del fondo oscuro
    this.rimLight = new THREE.DirectionalLight(0xffd166, 2.2);
    this.rimLight.position.set(0.0, 11.0, -11.5);
    this.rimLight.castShadow = false;
    this.scene.add(this.rimLight);

    // 6. Generar mapa de reflexión de estudio equirectangular/PMREM inicial
    this.setupEnvironmentMap();
  }

  /**
   * Genera un mapa de reflexión de estudio fotográfico con degradado esférico y softboxes
   * para dotar de reflejos especulares de altísima calidad al metalness y clearcoat.
   */
  public setupEnvironmentMap(realm?: RealmConfig): void {
    if (typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo degradado de estudio atmosférico (Zenith zafiro -> Horizonte crepuscular -> Nadir obsidiana)
    const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
    baseGrad.addColorStop(0.0, '#0d1322');
    baseGrad.addColorStop(0.35, '#1a1d36');
    baseGrad.addColorStop(0.50, '#2d2538');
    baseGrad.addColorStop(0.70, '#15141d');
    baseGrad.addColorStop(1.0, '#08090f');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // 1. Softbox Key Light cálido superior (Lon ~60°, Lat ~35°)
    const keySpot = ctx.createRadialGradient(600, 140, 10, 600, 140, 150);
    keySpot.addColorStop(0.0, '#ffffff');
    keySpot.addColorStop(0.2, '#fff4e2');
    keySpot.addColorStop(0.5, 'rgba(255, 228, 175, 0.65)');
    keySpot.addColorStop(0.8, 'rgba(255, 195, 130, 0.20)');
    keySpot.addColorStop(1.0, 'rgba(255, 195, 130, 0)');
    ctx.fillStyle = keySpot;
    ctx.beginPath();
    ctx.arc(600, 140, 150, 0, Math.PI * 2);
    ctx.fill();

    // 2. Franja Rim Light dorada posterior (Lon ~180°)
    const rimSpot = ctx.createRadialGradient(180, 200, 8, 180, 200, 130);
    const rimHex = realm ? '#' + (realm.palette.primary || 0xffd166).toString(16).padStart(6, '0') : '#ffd166';
    rimSpot.addColorStop(0.0, '#fffbe6');
    rimSpot.addColorStop(0.3, rimHex);
    rimSpot.addColorStop(0.7, 'rgba(243, 156, 18, 0.35)');
    rimSpot.addColorStop(1.0, 'rgba(243, 156, 18, 0)');
    ctx.fillStyle = rimSpot;
    ctx.beginPath();
    ctx.arc(180, 200, 130, 0, Math.PI * 2);
    ctx.fill();

    // 3. Softbox Fill Light complementario azul/violeta (Lon ~300°)
    const fillSpot = ctx.createRadialGradient(860, 220, 12, 860, 220, 160);
    fillSpot.addColorStop(0.0, '#b8b5ff');
    fillSpot.addColorStop(0.4, 'rgba(118, 98, 235, 0.55)');
    fillSpot.addColorStop(0.8, 'rgba(55, 45, 110, 0.18)');
    fillSpot.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fillSpot;
    ctx.beginPath();
    ctx.arc(860, 220, 160, 0, Math.PI * 2);
    ctx.fill();

    // 4. Difusor superior de cúpula (Zenith soft glow)
    const domeSpot = ctx.createRadialGradient(512, 40, 20, 512, 40, 240);
    domeSpot.addColorStop(0.0, 'rgba(255, 255, 255, 0.45)');
    domeSpot.addColorStop(0.5, 'rgba(235, 240, 255, 0.20)');
    domeSpot.addColorStop(1.0, 'rgba(180, 200, 240, 0)');
    ctx.fillStyle = domeSpot;
    ctx.beginPath();
    ctx.arc(512, 40, 240, 0, Math.PI * 2);
    ctx.fill();

    const canvasTex = new THREE.CanvasTexture(canvas);
    canvasTex.mapping = THREE.EquirectangularReflectionMapping;

    if (this.renderer) {
      try {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        const renderTarget = pmrem.fromEquirectangular(canvasTex);

        if (this.envMapTexture) {
          this.envMapTexture.dispose();
        }
        this.envMapTexture = renderTarget.texture;
        this.scene.environment = this.envMapTexture;
        pmrem.dispose();
        canvasTex.dispose();
        return;
      } catch {
        // En caso de contexto simulado o headless, usar el canvasTexture directo
      }
    }

    if (this.envMapTexture) {
      this.envMapTexture.dispose();
    }
    this.envMapTexture = canvasTex;
    this.scene.environment = this.envMapTexture;
  }

  public loadRealmEnvironment(realm: RealmConfig, enableParticles = true): void {
    this.disposeCurrentEnvironment();

    // 1. Niebla e iluminación cinematográfica calibrada por reino
    this.scene.background = new THREE.Color(realm.palette.fogColor);
    this.scene.fog = new THREE.FogExp2(realm.palette.fogColor, realm.palette.fogDensity);

    // Ajuste cromático de luces sin perder contraste
    this.ambientLight.color.setHex(0x1a1a2e);
    this.hemisphereLight.color.setHex(realm.palette.secondary || 0x38325a);
    this.hemisphereLight.groundColor.setHex(0x111322);

    this.mainLight.color.setHex(0xfff3df);
    this.rimLight.color.setHex(realm.palette.primary || 0xffd166);
    this.fillLight.color.setHex(0x7080b0);

    // Actualizar reflejos de entorno de estudio con los tonos del reino
    this.setupEnvironmentMap(realm);

    // 2. Mesa monumental y pedestal bajo el tablero
    const tableMat = new THREE.MeshPhysicalMaterial({
      color: 0x19161c,
      roughness: 0.25,
      metalness: 0.35,
      clearcoat: 0.65,
      clearcoatRoughness: 0.15,
    });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.6, 11.8), tableMat);
    tableTop.position.y = -0.55;
    tableTop.receiveShadow = true;
    this.environmentGroup.add(tableTop);

    // Zócalo dorado perimetral en la mesa
    const tableTrimMat = new THREE.MeshStandardMaterial({
      color: realm.palette.primary || 0xd4af37,
      roughness: 0.20,
      metalness: 0.88,
    });
    const tableTrim = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.08, 12.0), tableTrimMat);
    tableTrim.position.y = -0.27;
    tableTrim.receiveShadow = true;
    this.environmentGroup.add(tableTrim);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.8, 6.5, 20), tableMat);
    pillar.position.y = -4.0;
    this.environmentGroup.add(pillar);

    // 3. El Trono del Rival al fondo (z = -8.2)
    this.buildThroneForRealm(realm);

    // 4. Arquitectura perimetral con columnas desplazadas para no ocluir la cámara
    this.buildRealmArchitecture(realm);

    // 5. Sistemas de partículas ambientales
    if (enableParticles && realm.ambientElements.length > 0) {
      this.activeParticleType = realm.ambientElements[0];
      this.buildParticleSystem(realm);
    }
  }

  private buildThroneForRealm(realm: RealmConfig): void {
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: realm.palette.primary || 0xd4af37,
      roughness: 0.20,
      metalness: 0.90,
    });
    const velvetMat = new THREE.MeshPhysicalMaterial({
      color: realm.palette.secondary,
      roughness: 0.55,
      metalness: 0.18,
      clearcoat: 0.40,
    });
    const obsidianMat = new THREE.MeshPhysicalMaterial({
      color: 0x141218,
      roughness: 0.20,
      metalness: 0.45,
      clearcoat: 0.75,
    });

    // Intentar cargar modelo GLB del trono si existe
    const customThrone = AssetLoader.getInstance().getClonedThroneSync(realm.id);
    if (customThrone) {
      // Calcular profundidad del modelo para colocarlo estrictamente detrás del actor (z <= -7.85)
      const bbox = new THREE.Box3().setFromObject(customThrone);
      const maxZ = bbox.max.z;
      const throneZ = -7.88 - Math.max(0, maxZ);
      customThrone.position.set(0, -0.5, throneZ);

      // Estilizar mallas importadas con materiales contrastantes
      let meshIdx = 0;
      customThrone.traverse((child) => {
        const m = child as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
          m.material = meshIdx % 2 === 0 ? goldTrimMat : velvetMat;
          meshIdx++;
        }
      });
      this.environmentGroup.add(customThrone);

      // Gema real luminosa en el vértice del trono importado
      const apexGemMat = new THREE.MeshStandardMaterial({
        color: realm.palette.accent,
        emissive: realm.palette.accent,
        emissiveIntensity: 0.85,
        roughness: 0.1,
        metalness: 0.2,
      });
      const apexGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), apexGemMat);
      apexGem.position.set(0, 6.2, throneZ);
      PostProcessingPipeline.markForSelectiveBloom(apexGem);
      this.environmentGroup.add(apexGem);

      this.addThroneTorches(realm);
      return;
    }

    // Trono monumental procedural con contrastes ricos (Plataforma, Terciopelo, Oro, Gemas)
    const throneGroup = new THREE.Group();
    throneGroup.position.set(0, -0.5, -8.5);

    // Estrado / Tarima de obsidiana
    const dais = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.4, 2.8), obsidianMat);
    dais.position.set(0, 0.2, 0);
    dais.receiveShadow = true;
    throneGroup.add(dais);

    // Asiento y cojín detrás del actor (z <= -7.85 en mundo) para evitar oclusión
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 1.2), velvetMat);
    seat.position.set(0, 0.65, 0.1);
    seat.castShadow = true;
    throneGroup.add(seat);

    // Respaldo monumental de terciopelo (en z = -0.4 respecto al grupo -> z = -8.9 en mundo)
    const backHeight = realm.id === 'void_throne' ? 7.6 : 6.4;
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(3.4, backHeight, 0.45), velvetMat);
    backrest.position.set(0, backHeight / 2 + 0.4, -0.4);
    backrest.castShadow = true;
    throneGroup.add(backrest);

    // Columnas laterales y espiras doradas del trono
    for (const sx of [-1.8, 1.8]) {
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, backHeight + 1.2, 12), goldTrimMat);
      spire.position.set(sx, (backHeight + 1.2) / 2 + 0.2, -0.7);
      spire.castShadow = true;
      throneGroup.add(spire);
    }

    // Corona / Cresta dorada del trono
    const crest = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.8, 5), goldTrimMat);
    crest.position.set(0, backHeight + 1.1, -0.7);
    crest.castShadow = true;
    throneGroup.add(crest);

    // Gema real luminosa en el vértice de la corona
    const apexGemMat = new THREE.MeshStandardMaterial({
      color: realm.palette.accent,
      emissive: realm.palette.accent,
      emissiveIntensity: 0.85,
      roughness: 0.1,
      metalness: 0.2,
    });
    const apexGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), apexGemMat);
    apexGem.position.set(0, backHeight + 2.2, -0.7);
    PostProcessingPipeline.markForSelectiveBloom(apexGem);
    throneGroup.add(apexGem);

    // Reposabrazos esculpidos con almohadillas doradas
    for (const sx of [-1.65, 1.65]) {
      const armBase = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.3, 2.2), obsidianMat);
      armBase.position.set(sx, 1.05, 0.3);
      armBase.castShadow = true;

      const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 2.3), goldTrimMat);
      armPad.position.set(sx, 1.72, 0.3);
      armPad.castShadow = true;

      throneGroup.add(armBase, armPad);
    }

    this.environmentGroup.add(throneGroup);
    this.addThroneTorches(realm);
  }

  private addThroneTorches(realm: RealmConfig): void {
    const leftTorch = new THREE.PointLight(realm.palette.primary || 0xffd166, 3.5, 18);
    leftTorch.position.set(-5.5, 3.2, -7.8);

    const rightTorch = new THREE.PointLight(realm.palette.primary || 0xffd166, 3.5, 18);
    rightTorch.position.set(5.5, 3.2, -7.8);

    this.environmentGroup.add(leftTorch, rightTorch);
    this.pointLights.push(leftTorch, rightTorch);
  }

  private buildRealmArchitecture(realm: RealmConfig): void {
    const archMat = new THREE.MeshPhysicalMaterial({
      color: 0x2b2832,
      roughness: 0.45,
      metalness: 0.25,
      clearcoat: 0.35,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: realm.palette.accent,
      emissive: realm.palette.accent,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.85,
    });

    // Columnas perimetrales estrictamente en el hemiciclo de fondo (z <= -13m) para jamás interferir con la cámara
    const columnCount = 12;
    const colGeo =
      realm.id === 'elven_throne'
        ? new THREE.CylinderGeometry(0.45, 0.85, 20, 8)
        : realm.id === 'void_throne'
        ? new THREE.OctahedronGeometry(1.4, 0)
        : new THREE.CylinderGeometry(0.75, 1.1, 20, 12);

    const instancedColumns = new THREE.InstancedMesh(colGeo, archMat, columnCount);
    instancedColumns.castShadow = true;
    instancedColumns.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < columnCount; i++) {
      // Hemiciclo profundo estrictamente detrás del trono (z de -14m a -26m, x de -22m a +22m)
      const t = i / (columnCount - 1);
      const angle = Math.PI * 0.18 + t * Math.PI * 0.64;
      const radius = 24.0 + (i % 2 === 0 ? 0 : 2.5);
      const x = Math.cos(angle) * radius;
      const z = -Math.sin(angle) * (radius * 0.6) - 10.0;
      dummy.position.set(x, 6.0, z);
      dummy.rotation.y = -angle;
      dummy.updateMatrix();
      instancedColumns.setMatrixAt(i, dummy.matrix);
    }
    this.environmentGroup.add(instancedColumns);

    // Universal 3D props para todos los 10 reinos: Estandartes heráldicos y Braseros de hierro al fondo
    // 1. Estandartes reales de terciopelo y oro flanqueando el trono al fondo (z = -8.2)
    for (const side of [-5.5, 5.5]) {
      const banner = AssetLoader.getInstance().getClonedEnvSync('royal_banner');
      if (banner) {
        banner.position.set(side, 3.2, -8.2);
        banner.scale.set(1.0, 1.0, 1.0);
        if (side > 0) banner.rotation.y = Math.PI;
        this.styleRoyalBanner(banner, realm);
        this.environmentGroup.add(banner);
      }
    }

    // 2. Braseros de hierro forjado al fondo junto a los estandartes (z = -7.8, escala moderada 0.45)
    for (const side of [-5.5, 5.5]) {
      const brazier = AssetLoader.getInstance().getClonedEnvSync('brazier_torch');
      if (brazier) {
        brazier.position.set(side, -0.5, -7.8);
        brazier.scale.set(0.45, 0.45, 0.45);
        this.styleBrazier(brazier, realm);
        this.environmentGroup.add(brazier);
      }

      // Llama viva incandescente sobre cada brasero
      const flameMat = new THREE.MeshStandardMaterial({
        color: realm.palette.primary || 0xffaa00,
        emissive: realm.palette.primary || 0xffaa00,
        emissiveIntensity: 1.8,
        roughness: 0.1,
      });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 8), flameMat);
      flame.position.set(side, 1.35, -7.8);
      PostProcessingPipeline.markForSelectiveBloom(flame);
      this.environmentGroup.add(flame);
      this.floatingObjects.push(flame);
    }

    // 4. Elementos arquitectónicos emblemáticos y monumentales por facción con materiales PBR contrastantes
    switch (realm.id) {
      case 'eternal_crown': {
        // Ventanal gótico de vitrales iluminado detrás del trono
        const customWindow = AssetLoader.getInstance().getClonedEnvSync('stained_glass_window');
        if (customWindow) {
          customWindow.position.set(0, 1.0, -12.5);
          customWindow.scale.set(1.2, 1.2, 1.2);
          this.styleStainedGlassWindow(customWindow, realm);
          PostProcessingPipeline.markForSelectiveBloom(customWindow);
          this.environmentGroup.add(customWindow);
        } else {
          const roseFrame = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.4, 24), accentMat);
          roseFrame.position.set(0, 6.8, -12.5);
          PostProcessingPipeline.markForSelectiveBloom(roseFrame);
          this.environmentGroup.add(roseFrame);
        }
        break;
      }
      case 'elven_throne': {
        // Portal arbóreo bioluminiscente con luz esmeralda y arcos lunares plateados
        const customWindow = AssetLoader.getInstance().getClonedEnvSync('stained_glass_window');
        if (customWindow) {
          customWindow.position.set(0, 1.0, -12.5);
          customWindow.scale.set(1.2, 1.2, 1.2);
          this.styleStainedGlassWindow(customWindow, realm);
          PostProcessingPipeline.markForSelectiveBloom(customWindow);
          this.environmentGroup.add(customWindow);
        }
        const moonRing = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.12, 12, 48), accentMat);
        moonRing.position.set(0, 6.2, -12.2);
        PostProcessingPipeline.markForSelectiveBloom(moonRing);
        this.environmentGroup.add(moonRing);
        this.floatingObjects.push(moonRing);

        // 4 Linternas de cristal flotantes con floración mística
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), accentMat);
          lantern.position.set(Math.cos(angle) * 6.5, 4.5 + Math.sin(angle) * 1.5, -10.5);
          PostProcessingPipeline.markForSelectiveBloom(lantern);
          this.environmentGroup.add(lantern);
          this.floatingObjects.push(lantern);
        }
        break;
      }
      case 'iron_bastion': {
        // Enorme sistema de engranajes rúnicos de forja enana con lava incandescente
        const outerCog = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.42, 8, 16), accentMat);
        outerCog.position.set(0, 6.0, -12.2);
        PostProcessingPipeline.markForSelectiveBloom(outerCog);
        this.environmentGroup.add(outerCog);
        this.floatingObjects.push(outerCog);

        const innerCog = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.30, 6, 12), archMat);
        innerCog.position.set(0, 6.0, -12.0);
        this.environmentGroup.add(innerCog);
        this.floatingObjects.push(innerCog);

        // Pilares de basalto de fundición a los lados con vetas de magma
        for (const side of [-6.8, 6.8]) {
          const forgePylon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 10, 8), archMat);
          forgePylon.position.set(side, 3.5, -11.0);
          forgePylon.castShadow = true;
          this.environmentGroup.add(forgePylon);
        }
        break;
      }
      case 'ash_throne': {
        // Colosales colmillos y espiras de obsidiana bélica orca con runas de sangre
        for (const side of [-1, 1]) {
          const fang1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 11.0, 4), archMat);
          fang1.position.set(side * 7.5, 3.0, -10.5);
          fang1.rotation.z = side * 0.32;
          fang1.castShadow = true;
          this.environmentGroup.add(fang1);

          const fang2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 8.0, 4), archMat);
          fang2.position.set(side * 5.2, 2.0, -9.5);
          fang2.rotation.z = -side * 0.22;
          fang2.castShadow = true;
          this.environmentGroup.add(fang2);
        }
        const warRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.28, 8, 32), accentMat);
        warRing.position.set(0, 5.8, -12.0);
        PostProcessingPipeline.markForSelectiveBloom(warRing);
        this.environmentGroup.add(warRing);
        this.floatingObjects.push(warRing);
        break;
      }
      case 'draconic_empire': {
        // Cuernos volcánicos y halo solar de fuego de dragón
        for (const side of [-1, 1]) {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(1.5, 12.0, 6), archMat);
          horn.position.set(side * 7.2, 3.5, -10.2);
          horn.rotation.z = side * 0.35;
          horn.castShadow = true;
          this.environmentGroup.add(horn);
        }
        const dragonHalo = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.8, 32), accentMat);
        dragonHalo.position.set(0, 6.5, -12.0);
        PostProcessingPipeline.markForSelectiveBloom(dragonHalo);
        this.environmentGroup.add(dragonHalo);
        this.floatingObjects.push(dragonHalo);
        break;
      }
      case 'shadow_court': {
        // Ventanal gótico carmesí de vitrales góticos y rosetón vampírico con bloom
        const customWindow = AssetLoader.getInstance().getClonedEnvSync('stained_glass_window');
        if (customWindow) {
          customWindow.position.set(0, 1.0, -12.5);
          customWindow.scale.set(1.2, 1.2, 1.2);
          this.styleStainedGlassWindow(customWindow, realm);
          PostProcessingPipeline.markForSelectiveBloom(customWindow);
          this.environmentGroup.add(customWindow);
        }
        const roseFrame = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.6, 32), accentMat);
        roseFrame.position.set(0, 6.8, -12.2);
        PostProcessingPipeline.markForSelectiveBloom(roseFrame);
        this.environmentGroup.add(roseFrame);
        this.floatingObjects.push(roseFrame);

        for (const side of [-6.5, 6.5]) {
          const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 12, 8), archMat);
          spire.position.set(side, 4.0, -11.0);
          spire.castShadow = true;
          this.environmentGroup.add(spire);
        }
        break;
      }
      case 'celestial_sanctuary': {
        // Portal catedralicio con anillos sagrados concéntricos de halos dorados
        const customWindow = AssetLoader.getInstance().getClonedEnvSync('stained_glass_window');
        if (customWindow) {
          customWindow.position.set(0, 1.0, -12.5);
          customWindow.scale.set(1.2, 1.2, 1.2);
          this.styleStainedGlassWindow(customWindow, realm);
          PostProcessingPipeline.markForSelectiveBloom(customWindow);
          this.environmentGroup.add(customWindow);
        }
        for (let r = 0; r < 3; r++) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2 + r * 1.1, 0.08, 10, 48), accentMat);
          ring.position.set(0, 5.5, -11.5);
          ring.rotation.set(r * 0.45, r * 0.75, 0);
          PostProcessingPipeline.markForSelectiveBloom(ring);
          this.environmentGroup.add(ring);
          this.floatingObjects.push(ring);
        }
        break;
      }
      case 'snow_dominion': {
        // Monolitos de hielo glaciar esculpido y halo hexagonal rúnico de ventisca
        const iceMat = new THREE.MeshPhysicalMaterial({
          color: 0x93c5fd,
          roughness: 0.12,
          metalness: 0.15,
          transmission: 0.65,
          thickness: 1.2,
          clearcoat: 0.95,
        });
        for (const side of [-1, 1]) {
          const glacier = new THREE.Mesh(new THREE.ConeGeometry(1.3, 10.5, 5), iceMat);
          glacier.position.set(side * 6.8, 3.2, -10.5);
          glacier.rotation.z = side * 0.28;
          glacier.castShadow = true;
          this.environmentGroup.add(glacier);
        }
        const frostHex = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.5, 6), accentMat);
        frostHex.position.set(0, 6.2, -12.2);
        PostProcessingPipeline.markForSelectiveBloom(frostHex);
        this.environmentGroup.add(frostHex);
        this.floatingObjects.push(frostHex);
        break;
      }
      case 'sand_kingdom': {
        // Ventanal arabesco de sol dorado y crecientes solares de latón
        const customWindow = AssetLoader.getInstance().getClonedEnvSync('stained_glass_window');
        if (customWindow) {
          customWindow.position.set(0, 1.0, -12.5);
          customWindow.scale.set(1.2, 1.2, 1.2);
          this.styleStainedGlassWindow(customWindow, realm);
          PostProcessingPipeline.markForSelectiveBloom(customWindow);
          this.environmentGroup.add(customWindow);
        }
        const crescent = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.3, 32, 1, 0, Math.PI * 1.3), accentMat);
        crescent.position.set(0, 6.2, -12.0);
        PostProcessingPipeline.markForSelectiveBloom(crescent);
        this.environmentGroup.add(crescent);
        this.floatingObjects.push(crescent);

        for (const side of [-6.4, 6.4]) {
          const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 11, 8), archMat);
          minaret.position.set(side, 3.5, -10.8);
          minaret.castShadow = true;
          this.environmentGroup.add(minaret);
        }
        break;
      }
      case 'void_throne': {
        // Singularidad del vacío cósmico con 4 anillos de horizonte de sucesos y obeliscos
        for (let r = 0; r < 4; r++) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(2.8 + r * 1.0, 0.08, 12, 64), accentMat);
          ring.position.set(0, 5.0, -11.8);
          ring.rotation.set(r * 0.6, r * 0.9, r * 0.3);
          PostProcessingPipeline.markForSelectiveBloom(ring);
          this.environmentGroup.add(ring);
          this.floatingObjects.push(ring);
        }
        for (let i = 0; i < 4; i++) {
          const obelisk = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), archMat);
          obelisk.position.set((i % 2 === 0 ? -6.2 : 6.2), 3.0 + i * 1.8, -10.5);
          this.environmentGroup.add(obelisk);
          this.floatingObjects.push(obelisk);
        }
        break;
      }
    }
  }

  private styleStainedGlassWindow(group: THREE.Group, realm: RealmConfig): void {
    const glassMat = new THREE.MeshStandardMaterial({
      color: realm.palette.primary || 0xd4af37,
      emissive: realm.palette.primary || 0xd4af37,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.3,
    });
    group.traverse((child) => {
      const m = child as THREE.Mesh;
      if (m.isMesh) {
        m.material = glassMat;
      }
    });
  }

  private styleRoyalBanner(group: THREE.Group, realm: RealmConfig): void {
    const clothMat = new THREE.MeshPhysicalMaterial({
      color: realm.palette.secondary,
      roughness: 0.65,
      metalness: 0.12,
      clearcoat: 0.25,
    });
    group.traverse((child) => {
      const m = child as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.material = clothMat;
      }
    });
  }

  private styleBrazier(group: THREE.Group, realm: RealmConfig): void {
    const ironMat = new THREE.MeshPhysicalMaterial({
      color: 0x3a332d,
      roughness: 0.32,
      metalness: 0.82,
      clearcoat: 0.40,
    });
    group.traverse((child) => {
      const m = child as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.material = ironMat;
      }
    });
  }

  private styleStoneBarrier(group: THREE.Group, realm: RealmConfig): void {
    const marbleMat = new THREE.MeshPhysicalMaterial({
      color: 0x2e2a34,
      roughness: 0.45,
      metalness: 0.22,
      clearcoat: 0.35,
    });
    group.traverse((child) => {
      const m = child as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.material = marbleMat;
      }
    });
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
    this.floatingObjects.forEach((obj, idx) => {
      obj.rotation.y += deltaSec * 0.45;
      obj.position.y += Math.sin(elapsedSec * 1.5 + idx) * 0.004;
    });

    // Parpadeo orgánico de las antorchas y braseros reales
    if (this.pointLights.length >= 2) {
      const flicker1 = Math.sin(elapsedSec * 6.0) * 0.25 + Math.cos(elapsedSec * 14.3) * 0.15;
      const flicker2 = Math.cos(elapsedSec * 7.5) * 0.25 + Math.sin(elapsedSec * 12.1) * 0.15;
      this.pointLights[0].intensity = 3.8 + flicker1;
      this.pointLights[1].intensity = 3.8 + flicker2;
    }

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
