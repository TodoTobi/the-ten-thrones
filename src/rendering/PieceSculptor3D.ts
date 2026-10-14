// src/rendering/PieceSculptor3D.ts
import * as THREE from 'three';
import { PieceColor, PieceSymbol, RealmConfig } from '../core/types';

export class PieceSculptor3D {
  public static buildSculptedPiece(
    type: PieceSymbol,
    color: PieceColor,
    realm: RealmConfig
  ): THREE.Group {
    const group = new THREE.Group();

    // Materiales PBR AAA adaptados al reino: marfil/alabastro pulido vs obsidiana imperial con clearcoat
    const isWhite = color === 'w';
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: isWhite ? 0xf5eee4 : 0x221c25,
      roughness: isWhite ? 0.20 : 0.24,
      metalness: isWhite ? 0.08 : 0.32,
      clearcoat: 0.70,
      clearcoatRoughness: 0.15,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xd4af37 : (realm.palette.primary || 0xd4af37),
      roughness: 0.18,
      metalness: 0.90,
    });

    // 1. Pedestal Escalonado Común con Anillo Metálico del Reino
    const baseProfile = [
      new THREE.Vector2(0.01, 0.0),
      new THREE.Vector2(0.39, 0.0),
      new THREE.Vector2(0.39, 0.06),
      new THREE.Vector2(0.34, 0.09),
      new THREE.Vector2(0.35, 0.14),
      new THREE.Vector2(0.28, 0.18),
    ];

    if (type === 'n') {
      // CABALLO ESCULPIDO (Pedestal + Cabeza Equina Extruida con Bisel y Crin)
      const pedestal = new THREE.Mesh(new THREE.LatheGeometry(baseProfile, 28), bodyMat);
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      group.add(pedestal);

      const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.025, 12, 28), accentMat);
      collarRing.rotation.x = Math.PI / 2;
      collarRing.position.y = 0.18;
      group.add(collarRing);

      // Silueta anatómica de cabeza, cuello, pecho, hocico y crin del caballo
      const horseShape = new THREE.Shape();
      horseShape.moveTo(-0.18, 0.18);
      horseShape.lineTo(0.18, 0.18);
      horseShape.quadraticCurveTo(0.24, 0.42, 0.14, 0.62); // Pecho musculoso
      horseShape.lineTo(0.26, 0.68);                       // Mentón
      horseShape.lineTo(0.30, 0.76);                       // Hocico frontal
      horseShape.lineTo(0.14, 0.88);                       // Puente nasal
      horseShape.lineTo(0.16, 1.02);                       // Oreja alerta
      horseShape.lineTo(0.06, 0.95);                       // Nuca
      horseShape.bezierCurveTo(-0.16, 0.88, -0.26, 0.55, -0.18, 0.18); // Arco de la crin

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.14,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 2,
        bevelSize: 0.045,
        bevelThickness: 0.045,
      };
      const headGeo = new THREE.ExtrudeGeometry(horseShape, extrudeSettings);
      headGeo.center();
      const headMesh = new THREE.Mesh(headGeo, bodyMat);
      headMesh.position.y = 0.58;
      headMesh.rotation.y = isWhite ? Math.PI / 2 : -Math.PI / 2;
      headMesh.castShadow = true;
      headMesh.receiveShadow = true;
      group.add(headMesh);

      return group;
    }

    // Perfiles de revolución de alta densidad (32 segmentos) por jerarquía de pieza
    const bodyProfiles: Record<Exclude<PieceSymbol, 'n'>, THREE.Vector2[]> = {
      p: [
        ...baseProfile,
        new THREE.Vector2(0.16, 0.42),
        new THREE.Vector2(0.21, 0.46),
        new THREE.Vector2(0.13, 0.50),
        new THREE.Vector2(0.01, 0.52),
      ],
      r: [
        ...baseProfile,
        new THREE.Vector2(0.24, 0.58),
        new THREE.Vector2(0.31, 0.66),
        new THREE.Vector2(0.31, 0.78),
        new THREE.Vector2(0.18, 0.78),
        new THREE.Vector2(0.01, 0.72),
      ],
      b: [
        ...baseProfile,
        new THREE.Vector2(0.15, 0.56),
        new THREE.Vector2(0.23, 0.62),
        new THREE.Vector2(0.24, 0.82),
        new THREE.Vector2(0.16, 0.98),
        new THREE.Vector2(0.01, 1.04),
      ],
      q: [
        ...baseProfile,
        new THREE.Vector2(0.15, 0.68),
        new THREE.Vector2(0.25, 0.74),
        new THREE.Vector2(0.18, 0.96),
        new THREE.Vector2(0.29, 1.15),
        new THREE.Vector2(0.18, 1.18),
        new THREE.Vector2(0.01, 1.22),
      ],
      k: [
        ...baseProfile,
        new THREE.Vector2(0.17, 0.74),
        new THREE.Vector2(0.27, 0.80),
        new THREE.Vector2(0.20, 1.05),
        new THREE.Vector2(0.31, 1.24),
        new THREE.Vector2(0.22, 1.30),
        new THREE.Vector2(0.01, 1.34),
      ],
    };

    const latheMesh = new THREE.Mesh(new THREE.LatheGeometry(bodyProfiles[type], 32), bodyMat);
    latheMesh.castShadow = true;
    latheMesh.receiveShadow = true;
    group.add(latheMesh);

    // Anillo ornamental en el cuello de cada pieza
    const ringHeights: Record<Exclude<PieceSymbol, 'n'>, number> = {
      p: 0.46, r: 0.64, b: 0.62, q: 0.74, k: 0.80
    };
    const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 10, 28), accentMat);
    neckRing.rotation.x = Math.PI / 2;
    neckRing.position.y = ringHeights[type];
    group.add(neckRing);

    // Remates específicos por pieza
    if (type === 'p') {
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.185, 24, 24), bodyMat);
      head.position.y = 0.64;
      head.castShadow = true;
      group.add(head);
    } else if (type === 'r') {
      // 6 Almenas arquitectónicas alrededor de la corona de la Torre
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const crenel = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.09), bodyMat);
        crenel.position.set(Math.cos(angle) * 0.25, 0.84, Math.sin(angle) * 0.25);
        crenel.rotation.y = -angle;
        crenel.castShadow = true;
        group.add(crenel);
      }
    } else if (type === 'b') {
      // Orbe de mitra y banda diagonal metálica
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), accentMat);
      orb.position.y = 1.08;
      const sash = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.018, 8, 24), accentMat);
      sash.position.y = 0.82;
      sash.rotation.x = Math.PI / 3;
      group.add(orb, sash);
    } else if (type === 'q') {
      // Diadema real de 8 puntas con perlas
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), accentMat);
        pearl.position.set(Math.cos(angle) * 0.25, 1.21, Math.sin(angle) * 0.25);
        group.add(pearl);
      }
      const topOrb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), accentMat);
      topOrb.position.y = 1.26;
      group.add(topOrb);
    } else if (type === 'k') {
      // Corona Imperial y Cruz Metálica Biselada (altura final calibrada exactamente en 1.45 unidades)
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.07), accentMat);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.06, 0.06), accentMat);
      crossV.position.y = 1.34 + 0.11;
      crossH.position.y = 1.40;
      crossV.castShadow = true;
      group.add(crossV, crossH);
    }

    return group;
  }

  private static cachedShadowTexture: THREE.CanvasTexture | null = null;

  public static getContactShadowTexture(): THREE.CanvasTexture | null {
    if (this.cachedShadowTexture) return this.cachedShadowTexture;
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    this.cachedShadowTexture = tex;
    return tex;
  }

  public static createContactShadow(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(0.82, 0.82);
    geo.rotateX(-Math.PI / 2);
    const texture = PieceSculptor3D.getContactShadowTexture();
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(geo, mat);
    shadow.position.y = 0.002;
    shadow.name = 'contact_shadow';
    return shadow;
  }
}
