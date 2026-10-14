// src/rendering/AssetLoader.ts

import * as THREE from 'three';

import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import { PieceColor, PieceSymbol, RealmConfig } from '../core/types';



export interface AssetNormalizationOptions {

  targetHeight?: number;

  alignBottomToZero?: boolean;

  castShadow?: boolean;

  receiveShadow?: boolean;

}



export class AssetLoader {

  private static instance: AssetLoader;

  private gltfLoader: GLTFLoader;

  private dracoLoader: DRACOLoader;



  // Caché de escenas maestras ya normalizadas

  private modelCache = new Map<string, THREE.Group>();

  // Peticiones en vuelo para evitar descargas duplicadas simultáneas

  private pendingRequests = new Map<string, Promise<THREE.Group | null>>();

  // Registro de rutas inexistentes (404) para no volver a consultar la red

  private missingPaths = new Set<string>();



  private constructor(dracoDecoderPath = '/draco/') {

    this.dracoLoader = new DRACOLoader();

    this.dracoLoader.setDecoderPath(dracoDecoderPath);

    this.dracoLoader.setDecoderConfig({ type: 'wasm' });



    this.gltfLoader = new GLTFLoader();

    this.gltfLoader.setDRACOLoader(this.dracoLoader);

  }



  public static getInstance(): AssetLoader {

    if (!AssetLoader.instance) {

      AssetLoader.instance = new AssetLoader();

    }

    return AssetLoader.instance;

  }



  /**

   * Precarga todos los modelos disponibles para un reino (piezas específicas,

   * piezas base y el trono del rival). Los que no existan en disco quedan

   * marcados silenciosamente para usar el generador procedural sin latencia.

   */

  public async preloadRealmAssets(realmId: string): Promise<void> {

    const pieceSymbols: PieceSymbol[] = ['p', 'r', 'n', 'b', 'q', 'k'];

    const targetHeights: Record<PieceSymbol, number> = {

      p: 0.78,

      r: 0.92,

      n: 0.98,

      b: 1.08,

      q: 1.28,

      k: 1.45,

    };



    const tasks: Promise<THREE.Group | null>[] = [];



    for (const sym of pieceSymbols) {

      const realmPieceUrl = `/assets/models/pieces/realms/${realmId}/${sym}.glb`;

      const defaultPieceUrl = `/assets/models/pieces/default/${sym}.glb`;



      tasks.push(

        this.loadModel(realmPieceUrl, {

          targetHeight: targetHeights[sym],

          alignBottomToZero: true,

        }).then((res) =>

          res

            ? res

            : this.loadModel(defaultPieceUrl, {

                targetHeight: targetHeights[sym],

                alignBottomToZero: true,

              })

        )

      );

    }



    // Precargar trono del reino

    const throneUrl = `/assets/models/thrones/${realmId}.glb`;

    tasks.push(

      this.loadModel(throneUrl, {

        targetHeight: 6.5,

        alignBottomToZero: true,

      })

    );



    await Promise.allSettled(tasks);

  }



  /**

   * Devuelve de forma síncrona un clon profundo de la pieza GLB (si ya fue

   * precargada y existe en public/assets/models) aplicando el material de facción,

   * o `null` para que Board3D use la pieza procedural.

   */

  public getClonedPieceMeshSync(

    realm: RealmConfig,

    type: PieceSymbol,

    color: PieceColor

  ): THREE.Group | null {

    const realmUrl = `/assets/models/pieces/realms/${realm.id}/${type}.glb`;

    const defaultUrl = `/assets/models/pieces/default/${type}.glb`;



    const template = this.modelCache.get(realmUrl) || this.modelCache.get(defaultUrl);

    if (!template) return null;



    const clone = template.clone(true);



    // Ajustar material PBR manteniendo mapas de normales/oclusión si el GLB los incluye

    const tintColor = color === 'w' ? 0xf2e9dc : 0x222024;

    const roughness = color === 'w' ? 0.25 : 0.35;

    const metalness = color === 'w' ? 0.15 : 0.45;



    clone.traverse((child) => {

      const mesh = child as THREE.Mesh;

      if (mesh.isMesh) {

        mesh.castShadow = true;

        mesh.receiveShadow = true;



        const origMat = mesh.material as THREE.MeshStandardMaterial;

        const newMat = origMat?.isMeshStandardMaterial

          ? origMat.clone()

          : new THREE.MeshStandardMaterial();



        newMat.color.setHex(tintColor);

        newMat.roughness = roughness;

        newMat.metalness = metalness;

        mesh.material = newMat;

      }

    });



    // Orientar caballos negros mirando hacia las blancas y viceversa

    if (type === 'n') {

      clone.rotation.y = color === 'w' ? Math.PI : 0;

    }



    return clone;

  }



  /**

   * Devuelve de forma síncrona el modelo GLB del trono del reino si fue precargado,

   * o `null` para usar el trono procedural.

   */

  public getClonedThroneSync(realmId: string): THREE.Group | null {

    const throneUrl = `/assets/models/thrones/${realmId}.glb`;

    const template = this.modelCache.get(throneUrl);

    if (!template) return null;



    const clone = template.clone(true);

    clone.traverse((child) => {

      const mesh = child as THREE.Mesh;

      if (mesh.isMesh) {

        mesh.castShadow = true;

        mesh.receiveShadow = true;

      }

    });

    return clone;

  }



  /**

   * Carga un archivo .glb/.gltf con deduplicación y normalización de BoundingBox.

   */

  public async loadModel(

    url: string,

    options: AssetNormalizationOptions = {}

  ): Promise<THREE.Group | null> {

    if (this.missingPaths.has(url)) return null;

    if (this.modelCache.has(url)) return this.modelCache.get(url)!;

    if (this.pendingRequests.has(url)) return this.pendingRequests.get(url)!;



    const request = new Promise<THREE.Group | null>((resolve) => {

      this.gltfLoader.load(

        url,

        (gltf: GLTF) => {

          const normalized = this.normalizeModel(gltf.scene, options);

          this.modelCache.set(url, normalized);

          this.pendingRequests.delete(url);

          resolve(normalized);

        },

        undefined,

        () => {

          // El archivo .glb no existe aún: registrar en missingPaths y usar fallback procedural

          this.missingPaths.add(url);

          this.pendingRequests.delete(url);

          resolve(null);

        }

      );

    });



    this.pendingRequests.set(url, request);

    return request;

  }



  /**

   * Centra el modelo en X/Z, alinea su base en Y = 0 y lo escala proporcionalmente

   * para que encaje exactamente en las casillas de 1x1 unidades del tablero.

   */

  private normalizeModel(

    root: THREE.Group,

    options: AssetNormalizationOptions

  ): THREE.Group {

    const wrapper = new THREE.Group();

    const box = new THREE.Box3().setFromObject(root);

    const size = new THREE.Vector3();

    const center = new THREE.Vector3();

    box.getSize(size);

    box.getCenter(center);



    if (options.targetHeight && size.y > 0.0001) {

      const scale = options.targetHeight / size.y;

      root.scale.setScalar(scale);

      box.setFromObject(root);

      box.getCenter(center);

    }



    root.position.x -= center.x;

    root.position.z -= center.z;



    if (options.alignBottomToZero !== false) {

      root.position.y -= box.min.y;

    } else {

      root.position.y -= center.y;

    }



    root.traverse((child) => {

      const mesh = child as THREE.Mesh;

      if (mesh.isMesh) {

        mesh.castShadow = options.castShadow ?? true;

        mesh.receiveShadow = options.receiveShadow ?? true;

      }

    });



    wrapper.add(root);

    return wrapper;

  }



  public disposeAll(): void {

    this.modelCache.forEach((group) => {

      group.traverse((obj) => {

        const mesh = obj as THREE.Mesh;

        if (mesh.isMesh) {

          mesh.geometry?.dispose();

          if (Array.isArray(mesh.material)) {

            mesh.material.forEach((m) => m.dispose());

          } else {

            mesh.material?.dispose();

          }

        }

      });

    });

    this.modelCache.clear();

    this.dracoLoader.dispose();

  }

}
