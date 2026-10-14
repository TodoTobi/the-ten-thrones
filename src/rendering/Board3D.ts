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
      this.camera.position.set(0, 6.8, 9.5);
      this.controls.target.set(0, 0.8, -2.2);

    } else if (preset === 'cinematic') {

      this.camera.position.set(4.5, 4.8, 8.8);

      this.controls.target.set(0, 1.2, -2.0);

    } else {

      this.camera.position.set(0, 13.5, 0.01);

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



    const borderMat = new THREE.MeshStandardMaterial({

      color: borderColor,

      roughness: roughness + 0.1,

      metalness,

    });

    const borderGeo = new THREE.BoxGeometry(9.2, 0.45, 9.2);

    const borderMesh = new THREE.Mesh(borderGeo, borderMat);

    borderMesh.position.y = -0.24;

    borderMesh.receiveShadow = true;

    this.boardGroup.add(borderMesh);



    const lightMat = new THREE.MeshStandardMaterial({ color: lightSquareColor, roughness, metalness });

    const darkMat = new THREE.MeshStandardMaterial({ color: darkSquareColor, roughness, metalness });

    const sqGeo = new THREE.BoxGeometry(1, 0.12, 1);



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

    if (this.activeRealm) {

      const glbPiece = AssetLoader.getInstance().getClonedPieceMeshSync(

        this.activeRealm,

        type,

        color

      );

      if (glbPiece) return glbPiece;

    }

    return this.createProceduralPieceMesh(type, color);

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

      const mesh = obj as THREE.Mesh;

      mesh.geometry?.dispose();

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
