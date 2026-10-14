// src/rendering/PostProcessingPipeline.ts

import * as THREE from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';



export const BLOOM_LAYER = 1;



export class PostProcessingPipeline {

  private renderer: THREE.WebGLRenderer;

  private scene: THREE.Scene;

  private camera: THREE.PerspectiveCamera;



  private bloomComposer: EffectComposer;

  private finalComposer: EffectComposer;

  private bloomPass: UnrealBloomPass;

  private cinematicPass: ShaderPass;



  private bloomLayer = new THREE.Layers();

  private darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

  private materialCache = new Map<string, THREE.Material | THREE.Material[]>();

  private savedBackground: THREE.Color | THREE.Texture | null = null;



  public enabled = true;

  public bloomEnabled = true;



  constructor(

    renderer: THREE.WebGLRenderer,

    scene: THREE.Scene,

    camera: THREE.PerspectiveCamera

  ) {

    this.renderer = renderer;

    this.scene = scene;

    this.camera = camera;

    this.bloomLayer.set(BLOOM_LAYER);



    const size = new THREE.Vector2();

    this.renderer.getSize(size);



    const renderScene = new RenderPass(this.scene, this.camera);



    // 1. Pase de Bloom en mitad de resolución para maximizar FPS

    this.bloomPass = new UnrealBloomPass(

      new THREE.Vector2(size.x * 0.5, size.y * 0.5),

      1.15, // strength

      0.45, // radius

      0.15  // threshold

    );



    this.bloomComposer = new EffectComposer(this.renderer);

    this.bloomComposer.renderToScreen = false;

    this.bloomComposer.addPass(renderScene);

    this.bloomComposer.addPass(this.bloomPass);



    // 2. Shader de mezcla aditiva + Viñeteado Cinematográfico Medieval

    this.cinematicPass = new ShaderPass(

      new THREE.ShaderMaterial({

        uniforms: {

          baseTexture: { value: null },

          bloomTexture: { value: this.bloomComposer.renderTarget2.texture },

          bloomActive: { value: 1.0 },

          vignetteOffset: { value: 0.95 },

          vignetteDarkness: { value: 1.35 },

        },

        vertexShader: `

          varying vec2 vUv;

          void main() {

            vUv = uv;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

          }

        `,

        fragmentShader: `

          uniform sampler2D baseTexture;

          uniform sampler2D bloomTexture;

          uniform float bloomActive;

          uniform float vignetteOffset;

          uniform float vignetteDarkness;

          varying vec2 vUv;



          void main() {

            vec4 baseColor = texture2D(baseTexture, vUv);

            vec4 bloomColor = texture2D(bloomTexture, vUv) * bloomActive;

            vec3 combined = baseColor.rgb + bloomColor.rgb;



            // Viñeteado cinematográfico suave hacia los bordes

            vec2 uv = (vUv - vec2(0.5)) * vec2(vignetteOffset);

            float vignette = clamp(1.0 - dot(uv, uv) * vignetteDarkness * 0.45, 0.0, 1.0);

            combined *= vignette;



            gl_FragColor = vec4(combined, baseColor.a);

          }

        `,

        defines: {},

      }),

      'baseTexture'

    );

    this.cinematicPass.needsSwap = true;



    const outputPass = new OutputPass();



    this.finalComposer = new EffectComposer(this.renderer);

    this.finalComposer.addPass(renderScene);

    this.finalComposer.addPass(this.cinematicPass);

    this.finalComposer.addPass(outputPass);

  }



  /**

   * Marca cualquier Mesh o luz decorativa (runas, cristales, anillos, braseros)

   * para que brille en el pase de UnrealBloom sin afectar al resto del tablero.

   */

  public static markForSelectiveBloom(object: THREE.Object3D): void {

    object.traverse((child) => {

      child.layers.enable(BLOOM_LAYER);

    });

  }



  public setBloomParameters(strength: number, radius: number, threshold = 0.15): void {

    this.bloomPass.strength = strength;

    this.bloomPass.radius = radius;

    this.bloomPass.threshold = threshold;

  }



  public setBloomEnabled(active: boolean): void {

    this.bloomEnabled = active;

    this.cinematicPass.material.uniforms.bloomActive.value = active ? 1.0 : 0.0;

  }



  public setSize(width: number, height: number, pixelRatio: number): void {

    this.bloomComposer.setSize(width * 0.5, height * 0.5);

    this.bloomComposer.setPixelRatio(pixelRatio);

    this.finalComposer.setSize(width, height);

    this.finalComposer.setPixelRatio(pixelRatio);

  }



  public render(): void {

    if (!this.enabled) {

      this.renderer.render(this.scene, this.camera);

      return;

    }



    if (this.bloomEnabled) {

      // Aislar objetos sin la capa BLOOM_LAYER convirtiéndolos temporalmente a negro

      this.savedBackground = this.scene.background;

      this.scene.background = null;

      this.scene.traverse(this.darkenNonBloomed);

      this.bloomComposer.render();

      this.scene.traverse(this.restoreMaterials);

      this.scene.background = this.savedBackground;

    }



    this.finalComposer.render();

  }



  private darkenNonBloomed = (obj: THREE.Object3D): void => {

    const mesh = obj as THREE.Mesh;

    if ((mesh.isMesh || (obj as THREE.Points).isPoints) && !this.bloomLayer.test(obj.layers)) {

      this.materialCache.set(obj.uuid, mesh.material);

      mesh.material = this.darkMaterial;

    }

  };



  private restoreMaterials = (obj: THREE.Object3D): void => {

    const cached = this.materialCache.get(obj.uuid);

    if (cached) {

      (obj as THREE.Mesh).material = cached;

      this.materialCache.delete(obj.uuid);

    }

  };



  public dispose(): void {

    this.bloomComposer.dispose();

    this.finalComposer.dispose();

    this.darkMaterial.dispose();

    this.materialCache.clear();

  }

}
