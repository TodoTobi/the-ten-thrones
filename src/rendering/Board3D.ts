import { PieceSculptor3D } from './PieceSculptor3D';
// src/rendering/Board3D.ts

import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { PieceColor, PieceSymbol, RealmConfig } from '../core/types';

import { AssetLoader } from './AssetLoader';

import { PostProcessingPipeline } from './PostProcessingPipeline';



export class Board3D {

  private scene: THREE.Scene;

  private camera: THREE.PerspectiveCamera;

  private controls: OrbitControls;

  private domElement: HTMLElement;



  private activeRealm!: RealmConfig;

  private boardGroup = new THREE.Group();

  private squaresMap = new Map<string, THREE.Mesh>();

  private piecesMap = new Map<string, THREE.Group>();

  private highlightMeshes: THREE.Mesh[] = [];



  // Raycasting y Plano de Intersección Horizontal para Drag & Drop

  private raycaster = new THREE.Raycaster();

  private pointer = new THREE.Vector2();

  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.06);

  private dragIntersectPoint = new THREE.Vector3();



  // Estado de Selección y Arrastre

  private selectedSquare: string | null = null;

  private legalTargets: string[] = [];

  private isDragging = false;

  private dragCandidateSquare: string | null = null;

  private draggedPieceMesh: THREE.Group | null = null;

  private dragStartOriginWorld = new THREE.Vector3();

  private pointerDownScreenPos = new THREE.Vector2();

  private readonly dragThresholdPx = 5; // Diferencia clic rápido vs arrastre intencional

  private readonly dragLiftHeight = 0.55;



  // Indicador visual de casilla sobrevolada durante el arrastre

  private hoverMarker: THREE.Mesh;



  public onSquareSelected?: (square: string) => string[];

  public onMoveAttempt?: (from: string, to: string) => void;



  constructor(

    scene: THREE.Scene,

    camera: THREE.PerspectiveCamera,

    domElement: HTMLElement

  ) {

    this.scene = scene;

    this.camera = camera;

    this.domElement = domElement;

    this.scene.add(this.boardGroup);



    this.controls = new OrbitControls(this.camera, domElement);

    this.controls.enableDamping = true;

    this.controls.dampingFactor = 0.06;

    this.controls.minDistance = 6.5;

    this.controls.maxDistance = 18;

    this.controls.maxPolarAngle = Math.PI / 2.15;

    this.controls.minPolarAngle = 0.25;

    this.setCameraPreset('gameplay');



    // Crear marcador de previsualización de destino bajo la pieza arrastrada

    const hoverGeo = new THREE.PlaneGeometry(0.94, 0.94);

    hoverGeo.rotateX(-Math.PI / 2);

    const hoverMat = new THREE.MeshBasicMaterial({

      color: 0xffd166,

      transparent: true,

      opacity: 0.38,

      side: THREE.DoubleSide,

    });

    this.hoverMarker = new THREE.Mesh(hoverGeo, hoverMat);

    this.hoverMarker.visible = false;

    PostProcessingPipeline.markForSelectiveBloom(this.hoverMarker);

    this.boardGroup.add(this.hoverMarker);



    this.bindPointerEvents(domElement);

  }



  public setCameraPreset(preset: 'gameplay' | 'cinematic' | 'top'): void {
    if (preset === 'gameplay') {
      // Elevated angle centered on the board so White rank 1/2 clears the bottom HUD controls comfortably
      this.camera.position.set(0, 8.8, 10.6);
      this.controls.target.set(0, 0.3, 0.4);
    } else if (preset === 'cinematic') {
      this.camera.position.set(4.8, 5.5, 9.2);
      this.controls.target.set(0, 0.8, -1.0);
    } else {
      this.camera.position.set(0, 14.5, 0.01);
      this.controls.target.set(0, 0, 0);
    }
    this.controls.update();
  }



  public buildBoardForRealm(realm: RealmConfig): void {
    this.activeRealm = realm;
    this.clearBoardGeometry();
    this.squaresMap.clear();

    const { lightSquareColor, darkSquareColor, borderColor, roughness, metalness } =
      realm.boardMaterials;

    // 1. Placa de asiento e incrustación metálica bajo las 64 casillas (inlay channels)
    const inlayMat = new THREE.MeshStandardMaterial({
      color: 0x181412,
      roughness: 0.25,
      metalness: 0.85,
    });
    const inlayBed = new THREE.Mesh(new THREE.BoxGeometry(8.06, 0.08, 8.06), inlayMat);
    inlayBed.position.y = -0.01;
    inlayBed.receiveShadow = true;
    this.boardGroup.add(inlayBed);

    // 2. Marco exterior monumental: se ubica por debajo y alrededor de las casillas, NUNCA sobre ellas
    const customBoard = AssetLoader.getInstance().getClonedBoardSync(realm.id);
    if (customBoard) {
      // Medir el bounding box del modelo GLB importado para garantizar que su reborde superior
      // quede en y = 0.02 (por debajo del plano de juego de las casillas que está en y = 0.065)
      const bbox = new THREE.Box3().setFromObject(customBoard);
      const topY = bbox.max.y;
      customBoard.position.set(0, 0.02 - topY, 0);

      // Aplicar materiales PBR contrastantes de facción al marco importado
      customBoard.traverse((child) => {
        const m = child as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
          m.material = new THREE.MeshStandardMaterial({
            color: borderColor,
            roughness: roughness + 0.08,
            metalness: metalness,
          });
        }
      });
      this.boardGroup.add(customBoard);
    } else {
      // Marco escalonado procedural con molduras y zócalo dorado
      const borderMat = new THREE.MeshPhysicalMaterial({
        color: borderColor,
        roughness: roughness + 0.06,
        metalness: metalness,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
      });
      const borderBase = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.38, 9.6), borderMat);
      borderBase.position.y = -0.16;
      borderBase.receiveShadow = true;
      borderBase.castShadow = true;
      this.boardGroup.add(borderBase);

      const borderLipMat = new THREE.MeshStandardMaterial({
        color: realm.palette.primary || 0xd4af37,
        roughness: 0.2,
        metalness: 0.88,
      });
      const borderLip = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.06, 8.4), borderLipMat);
      borderLip.position.y = 0.01;
      borderLip.receiveShadow = true;
      this.boardGroup.add(borderLip);

      // Apliques esquineros dorados de protección y ornamentación
      const cornerGeo = new THREE.BoxGeometry(0.32, 0.04, 0.32);
      for (const cx of [-4.35, 4.35]) {
        for (const cz of [-4.35, 4.35]) {
          const corner = new THREE.Mesh(cornerGeo, borderLipMat);
          corner.position.set(cx, 0.035, cz);
          this.boardGroup.add(corner);
        }
      }
    }

    // 3. Notaciones algebraicas nítidas grabadas en el marco (Columnas A-H y Filas 1-8)
    this.buildRankAndFileNotations(realm.palette.primary || 0xd4af37);

    // 4. Generación de las 64 casillas biseladas con texturas procedurales PBR
    const sqGeo = this.createBeveledSquareGeometry();
    const lightTex = this.createSquareTexture(true, lightSquareColor);
    const darkTex = this.createSquareTexture(false, darkSquareColor);

    // Marfil / Alabastro radiante para casillas claras
    const lightMat = new THREE.MeshPhysicalMaterial({
      color: lightSquareColor,
      map: lightTex,
      roughness: 0.20,
      metalness: 0.05,
      clearcoat: 0.70,
      clearcoatRoughness: 0.15,
      reflectivity: 0.55,
    });

    // Caoba imperial profundo / Obsidiana volcánica para casillas oscuras
    const darkMat = new THREE.MeshPhysicalMaterial({
      color: darkSquareColor,
      map: darkTex,
      roughness: 0.18,
      metalness: 0.15,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 0.65,
    });

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        const sqName = `${files[c]}${8 - r}`;
        const mesh = new THREE.Mesh(sqGeo, isLight ? lightMat.clone() : darkMat.clone());
        mesh.position.set(c - 3.5, 0, r - 3.5);
        mesh.receiveShadow = true;
        mesh.userData = {
          square: sqName,
          isLight,
          baseColor: isLight ? lightSquareColor : darkSquareColor,
        };
        this.squaresMap.set(sqName, mesh);
        this.boardGroup.add(mesh);
      }
    }

    this.boardGroup.add(this.hoverMarker);
  }

  /**
   * Crea una geometría biselada con chaflán para casillas de ajedrez estilo AAA.
   * La cara superior queda a y = 0.065 con ancho 0.98 x 0.98 dejando canal de separación.
   */
  private createBeveledSquareGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const s = 0.47;
    shape.moveTo(-s, -s);
    shape.lineTo(s, -s);
    shape.lineTo(s, s);
    shape.lineTo(-s, s);
    shape.closePath();

    const sqGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.10,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.02,
      bevelThickness: 0.015,
    });
    sqGeo.rotateX(-Math.PI / 2);
    sqGeo.center();
    return sqGeo;
  }

  /**
   * Genera texturas procedurales en Canvas para Alabastro/Marfil y Caoba/Obsidiana
   */
  private createSquareTexture(isLight: boolean, baseHex: number): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const br = (baseHex >> 16) & 255;
    const bg = (baseHex >> 8) & 255;
    const bb = baseHex & 255;

    if (isLight) {
      ctx.fillStyle = `rgb(${br}, ${bg}, ${bb})`;
      ctx.fillRect(0, 0, 256, 256);

      // Vetas suaves de alabastro / marfil
      ctx.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const startX = (i * 50 + 20) % 256;
        ctx.moveTo(startX, 0);
        ctx.bezierCurveTo(startX + 35, 80, startX - 25, 160, (startX + 60) % 256, 256);
        ctx.strokeStyle = `rgba(${Math.min(255, br + 25)}, ${Math.min(255, bg + 20)}, ${Math.min(255, bb + 10)}, 0.32)`;
        ctx.stroke();
      }

      // Brillo cristalino de claro
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 85 + 30);
        ctx.bezierCurveTo(90, i * 85 + 60, 170, i * 85 + 10, 256, i * 85 + 40);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Viñeta perimetral de chaflán
      const grad = ctx.createRadialGradient(128, 128, 90, 128, 128, 130);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    } else {
      ctx.fillStyle = `rgb(${br}, ${bg}, ${bb})`;
      ctx.fillRect(0, 0, 256, 256);

      // Fina veta longitudinal de caoba real / estrías de obsidiana
      for (let y = 0; y < 256; y += 3) {
        const grainIntensity = 0.08 + Math.sin(y * 0.14) * 0.06;
        ctx.fillStyle = `rgba(255, 180, 130, ${grainIntensity})`;
        ctx.fillRect(0, y, 256, 1.5);
      }

      // Ondulaciones orgánicas de madera
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        const x = i * 40 + 10;
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + 22, 128, x + 6, 256);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Viñeta perimetral oscura
      const grad = ctx.createRadialGradient(128, 128, 85, 128, 128, 130);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Coloca notaciones de columnas (A-H) y filas (1-8) doradas grabadas en el marco exterior
   */
  private buildRankAndFileNotations(accentColorHex: number): void {
    const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const geo = new THREE.PlaneGeometry(0.38, 0.38);
    geo.rotateX(-Math.PI / 2);

    // Notación de columnas A-H en bordes inferior y superior
    for (let c = 0; c < 8; c++) {
      const texBottom = this.createNotationTexture(files[c], accentColorHex);
      const matBottom = new THREE.MeshBasicMaterial({
        map: texBottom,
        transparent: true,
        opacity: 0.90,
        depthWrite: false,
      });
      const badgeBottom = new THREE.Mesh(geo, matBottom);
      badgeBottom.position.set(c - 3.5, 0.032, 4.38);
      this.boardGroup.add(badgeBottom);

      const texTop = this.createNotationTexture(files[c], accentColorHex);
      const matTop = new THREE.MeshBasicMaterial({
        map: texTop,
        transparent: true,
        opacity: 0.70,
        depthWrite: false,
      });
      const badgeTop = new THREE.Mesh(geo, matTop);
      badgeTop.position.set(c - 3.5, 0.032, -4.38);
      badgeTop.rotation.y = Math.PI;
      this.boardGroup.add(badgeTop);
    }

    // Notación de filas 1-8 en bordes izquierdo y derecho
    for (let r = 0; r < 8; r++) {
      const rankNum = (8 - r).toString();
      const texLeft = this.createNotationTexture(rankNum, accentColorHex);
      const matLeft = new THREE.MeshBasicMaterial({
        map: texLeft,
        transparent: true,
        opacity: 0.90,
        depthWrite: false,
      });
      const badgeLeft = new THREE.Mesh(geo, matLeft);
      badgeLeft.position.set(-4.38, 0.032, r - 3.5);
      badgeLeft.rotation.y = Math.PI / 2;
      this.boardGroup.add(badgeLeft);

      const texRight = this.createNotationTexture(rankNum, accentColorHex);
      const matRight = new THREE.MeshBasicMaterial({
        map: texRight,
        transparent: true,
        opacity: 0.70,
        depthWrite: false,
      });
      const badgeRight = new THREE.Mesh(geo, matRight);
      badgeRight.position.set(4.38, 0.032, r - 3.5);
      badgeRight.rotation.y = -Math.PI / 2;
      this.boardGroup.add(badgeRight);
    }
  }

  /**
   * Genera un sello de letra o número con tipografía clásica y resplandor dorado
   */
  private createNotationTexture(text: string, colorHex: number): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 128, 128);
    ctx.font = 'bold 74px "Cinzel", "Georgia", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sombra grabada en bajorrelieve
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillText(text, 66, 68);

    // Texto dorado
    const hexStr = '#' + colorHex.toString(16).padStart(6, '0');
    ctx.fillStyle = hexStr;
    ctx.fillText(text, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }



  public syncPiecesFromMatrix(

    boardMatrix: ({ type: PieceSymbol; color: PieceColor; square: string } | null)[][]

  ): void {

    this.cancelActiveDrag(false);



    this.piecesMap.forEach((mesh) => {

      this.disposePieceGroup(mesh);

      this.boardGroup.remove(mesh);

    });

    this.piecesMap.clear();



    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {

      for (let c = 0; c < 8; c++) {

        const cell = boardMatrix[r][c];

        if (!cell) continue;

        const sqName = `${files[c]}${8 - r}`;

        const pieceGroup = this.resolvePieceMesh(cell.type, cell.color);

        const worldPos = this.squareToWorld(sqName);

        pieceGroup.position.copy(worldPos);

        pieceGroup.userData = { square: sqName, type: cell.type, color: cell.color };

        this.piecesMap.set(sqName, pieceGroup);

        this.boardGroup.add(pieceGroup);

      }

    }

  }



  private resolvePieceMesh(type: PieceSymbol, color: PieceColor): THREE.Group {
    let pieceGroup: THREE.Group;
    if (this.activeRealm) {
      const glbPiece = AssetLoader.getInstance().getClonedPieceMeshSync(
        this.activeRealm,
        type,
        color
      );
      pieceGroup = glbPiece ? glbPiece : this.createProceduralPieceMesh(type, color);
    } else {
      pieceGroup = this.createProceduralPieceMesh(type, color);
    }

    // Acoplar disco de sombra de contacto para asentar la pieza al ras sobre la casilla
    pieceGroup.add(PieceSculptor3D.createContactShadow());
    return pieceGroup;
  }



  private createProceduralPieceMesh(type: PieceSymbol, color: PieceColor): THREE.Group {
    return PieceSculptor3D.buildSculptedPiece(type, color, this.activeRealm);
  }



  public squareToWorld(square: string): THREE.Vector3 {

    const file = square.charCodeAt(0) - 97;

    const rank = 8 - parseInt(square[1], 10);

    return new THREE.Vector3(file - 3.5, 0.06, rank - 3.5);

  }



  /**

   * Convierte una coordenada X/Z del plano horizontal en notación algebraica ('a1'..'h8')

   * o devuelve null si el cursor se encuentra fuera de los límites de las 64 casillas.

   */

  public worldToSquare(point: THREE.Vector3): string | null {

    const col = Math.floor(point.x + 4.0);

    const row = Math.floor(point.z + 4.0);

    if (col < 0 || col > 7 || row < 0 || row > 7) return null;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return `${files[col]}${8 - row}`;

  }



  public getPieceMeshAt(square: string): THREE.Group | null {

    return this.piecesMap.get(square) || null;

  }



  public showLegalHighlights(squares: string[]): void {

    this.clearHighlights();

    const geo = new THREE.RingGeometry(0.22, 0.34, 24);

    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, side: THREE.DoubleSide });



    squares.forEach((sq) => {

      const marker = new THREE.Mesh(geo, mat);

      const pos = this.squareToWorld(sq);

      marker.position.set(pos.x, 0.08, pos.z);

      PostProcessingPipeline.markForSelectiveBloom(marker);

      this.boardGroup.add(marker);

      this.highlightMeshes.push(marker);

    });

  }



  public clearHighlights(): void {

    this.highlightMeshes.forEach((m) => {

      this.boardGroup.remove(m);

      m.geometry.dispose();

    });

    this.highlightMeshes = [];

  }



  private bindPointerEvents(domElement: HTMLElement): void {

    domElement.addEventListener('pointerdown', this.onPointerDown);

    window.addEventListener('pointermove', this.onPointerMove);

    window.addEventListener('pointerup', this.onPointerUp);

    window.addEventListener('pointercancel', () => this.cancelActiveDrag(true));

  }



  private updateRaycasterFromEvent(e: PointerEvent): void {

    const rect = this.domElement.getBoundingClientRect();

    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;

    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

  }



  private getHoveredSquareFromRay(): string | null {

    // 1. Verificar intersección directa con piezas o casillas

    const pieceObjects = Array.from(this.piecesMap.values());

    const pieceHits = this.raycaster.intersectObjects(pieceObjects, true);

    if (pieceHits.length > 0) {

      let obj: THREE.Object3D | null = pieceHits[0].object;

      while (obj && !obj.userData?.square) {

        obj = obj.parent;

      }

      if (obj?.userData?.square) return obj.userData.square as string;

    }



    const squareHits = this.raycaster.intersectObjects(Array.from(this.squaresMap.values()), false);

    if (squareHits.length > 0) {

      return squareHits[0].object.userData.square as string;

    }



    // 2. Fallback matemático sobre el plano horizontal

    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersectPoint)) {

      return this.worldToSquare(this.dragIntersectPoint);

    }



    return null;

  }



  private onPointerDown = (e: PointerEvent): void => {

    if (e.button !== 0) return;



    this.pointerDownScreenPos.set(e.clientX, e.clientY);

    this.updateRaycasterFromEvent(e);

    const clickedSq = this.getHoveredSquareFromRay();



    if (!clickedSq) return;



    // Caso 1: Había una pieza seleccionada previamente y se hace clic en un destino legal (Clic-a-Clic)

    if (this.selectedSquare && this.legalTargets.includes(clickedSq)) {

      const from = this.selectedSquare;

      this.selectedSquare = null;

      this.legalTargets = [];

      this.clearHighlights();

      this.onMoveAttempt?.(from, clickedSq);

      return;

    }



    // Caso 2: Consultar movimientos legales desde la casilla presionada

    const targets = this.onSquareSelected ? this.onSquareSelected(clickedSq) : [];

    const pieceMesh = this.piecesMap.get(clickedSq) || null;



    if (pieceMesh && targets.length > 0) {

      this.selectedSquare = clickedSq;

      this.legalTargets = targets;

      this.showLegalHighlights(targets);



      // Preparar candidato de arrastre y bloquear OrbitControls para que la cámara no gire al mover la pieza

      this.dragCandidateSquare = clickedSq;

      this.draggedPieceMesh = pieceMesh;

      this.dragStartOriginWorld.copy(this.squareToWorld(clickedSq));

      this.controls.enabled = false;

    } else {

      this.selectedSquare = null;

      this.legalTargets = [];

      this.clearHighlights();

    }

  };



  private onPointerMove = (e: PointerEvent): void => {

    if (!this.dragCandidateSquare || !this.draggedPieceMesh) return;



    const moveDistPx = this.pointerDownScreenPos.distanceTo(

      new THREE.Vector2(e.clientX, e.clientY)

    );



    if (!this.isDragging && moveDistPx >= this.dragThresholdPx) {

      this.isDragging = true;

      this.domElement.style.cursor = 'grabbing';

    }



    if (!this.isDragging) return;



    this.updateRaycasterFromEvent(e);



    // Intersectar el rayo del mouse contra el plano infinito horizontal del tablero

    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersectPoint)) {

      const clampedX = THREE.MathUtils.clamp(this.dragIntersectPoint.x, -4.3, 4.3);

      const clampedZ = THREE.MathUtils.clamp(this.dragIntersectPoint.z, -4.3, 4.3);



      this.draggedPieceMesh.position.set(

        clampedX,

        0.06 + this.dragLiftHeight,

        clampedZ

      );



      // Actualizar marcador de casilla destino si es una casilla legal

      const targetSq = this.worldToSquare(this.dragIntersectPoint);

      if (targetSq && this.legalTargets.includes(targetSq)) {

        const sqWorld = this.squareToWorld(targetSq);

        this.hoverMarker.position.set(sqWorld.x, 0.075, sqWorld.z);

        this.hoverMarker.visible = true;

      } else {

        this.hoverMarker.visible = false;

      }

    }

  };



  private onPointerUp = (e: PointerEvent): void => {

    if (e.button !== 0) return;



    this.controls.enabled = true;

    this.domElement.style.cursor = 'default';

    this.hoverMarker.visible = false;



    if (!this.dragCandidateSquare || !this.draggedPieceMesh) return;



    const fromSquare = this.dragCandidateSquare;

    const pieceMesh = this.draggedPieceMesh;

    const originWorld = this.dragStartOriginWorld.clone();

    const wasDragging = this.isDragging;



    this.dragCandidateSquare = null;

    this.draggedPieceMesh = null;

    this.isDragging = false;



    if (!wasDragging) {

      // Fue un clic simple: mantenemos la pieza seleccionada y sus casillas resaltadas para clic-a-clic

      return;

    }



    this.updateRaycasterFromEvent(e);

    let dropSquare: string | null = null;

    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersectPoint)) {

      dropSquare = this.worldToSquare(this.dragIntersectPoint);

    }



    // Si se suelta sobre un destino legal, ejecutar jugada

    if (dropSquare && dropSquare !== fromSquare && this.legalTargets.includes(dropSquare)) {

      const targetWorld = this.squareToWorld(dropSquare);

      pieceMesh.position.copy(targetWorld);

      this.selectedSquare = null;

      this.legalTargets = [];

      this.clearHighlights();

      this.onMoveAttempt?.(fromSquare, dropSquare);

    } else {

      // Si se suelta en casilla inválida o en la misma casilla de origen, regresar suavemente

      this.snapBackPiece(pieceMesh, originWorld);

    }

  };



  public cancelActiveDrag(animateBack = true): void {

    this.controls.enabled = true;

    this.domElement.style.cursor = 'default';

    this.hoverMarker.visible = false;



    if (this.draggedPieceMesh) {

      if (animateBack) {

        this.snapBackPiece(this.draggedPieceMesh, this.dragStartOriginWorld.clone());

      } else {

        this.draggedPieceMesh.position.copy(this.dragStartOriginWorld);

      }

    }



    this.dragCandidateSquare = null;

    this.draggedPieceMesh = null;

    this.isDragging = false;

  }



  private snapBackPiece(pieceMesh: THREE.Group, targetOrigin: THREE.Vector3): void {

    const startPos = pieceMesh.position.clone();

    const durationMs = 160;

    const startTime = performance.now();



    const step = (now: number) => {

      const t = Math.min(1, (now - startTime) / durationMs);

      const eased = 1 - Math.pow(1 - t, 3); // Cubic ease-out

      pieceMesh.position.lerpVectors(startPos, targetOrigin, eased);

      if (t < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  /**
   * Animates a player move with parabolic lift, travel, and landing settle,
   * including simultaneous Rook movement when castling ('k' or 'q' flags).
   */
  public async animatePlayerMove(
    from: string,
    to: string,
    flags: string,
    speedMultiplier = 1.0
  ): Promise<void> {
    const movingMesh = this.piecesMap.get(from);
    if (!movingMesh) return;

    const capturedMesh = this.piecesMap.get(to);
    const startWorld = this.squareToWorld(from);
    const endWorld = this.squareToWorld(to);

    // Detect simultaneous Rook movement for Kingside ('k') or Queenside ('q') Castling
    let rookMesh: THREE.Group | null = null;
    let rookStart = new THREE.Vector3();
    let rookEnd = new THREE.Vector3();

    if (flags.includes('k') || flags.includes('q')) {
      const rank = from[1];
      const rookFromSq = flags.includes('k') ? `h${rank}` : `a${rank}`;
      const rookToSq = flags.includes('k') ? `f${rank}` : `d${rank}`;
      rookMesh = this.piecesMap.get(rookFromSq) || null;
      rookStart = this.squareToWorld(rookFromSq);
      rookEnd = this.squareToWorld(rookToSq);
    }

    const durationMs = 340 / Math.max(0.5, speedMultiplier);
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs);
        // Smooth cubic ease-in-out
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        movingMesh.position.lerpVectors(startWorld, endWorld, eased);
        movingMesh.position.y += Math.sin(t * Math.PI) * 0.72;

        if (rookMesh) {
          rookMesh.position.lerpVectors(rookStart, rookEnd, eased);
          rookMesh.position.y += Math.sin(t * Math.PI) * 0.45;
        }

        if (capturedMesh && t > 0.65) {
          const shrink = Math.max(0.01, 1 - (t - 0.65) / 0.35);
          capturedMesh.scale.setScalar(shrink);
        }

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  /**
   * Triggers a restrained camera/board shudder when the rival slams the throne armrest
   * or when a heavy capture occurs.
   */
  public triggerImpactShake(intensity = 0.14, durationMs = 260): void {
    const originalTarget = this.controls.target.clone();
    const startTime = performance.now();

    const shakeStep = (now: number) => {
      const t = (now - startTime) / durationMs;
      if (t >= 1) {
        this.controls.target.copy(originalTarget);
        this.controls.update();
        return;
      }
      const decay = 1 - t;
      this.controls.target.set(
        originalTarget.x + (Math.random() - 0.5) * intensity * decay,
        originalTarget.y + (Math.random() - 0.5) * intensity * decay,
        originalTarget.z
      );
      this.controls.update();
      requestAnimationFrame(shakeStep);
    };
    requestAnimationFrame(shakeStep);
  }

  public update(): void {

    this.controls.update();

  }



  private clearBoardGeometry(): void {
    const toRemove = this.boardGroup.children.filter((c) => c !== this.hoverMarker);
    toRemove.forEach((obj) => {
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
        }
      });
      this.boardGroup.remove(obj);
    });
  }



  private disposePieceGroup(group: THREE.Group): void {

    group.traverse((obj) => {

      const mesh = obj as THREE.Mesh;

      if (mesh.isMesh) {

        if (

          !AssetLoader.getInstance().getClonedPieceMeshSync(

            this.activeRealm,

            group.userData.type,

            group.userData.color

          )

        ) {

          mesh.geometry?.dispose();

        }

        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());

        else mesh.material?.dispose();

      }

    });

  }

}
