// src/__tests__/assetLoader.test.ts

import { describe, it, expect } from 'vitest';

import { AssetLoader } from '../rendering/AssetLoader';

import { REALMS_CONFIG } from '../config/realms.config';



describe('THE TEN THRONES — AssetLoader & Fallback Procedural', () => {

  it('Devuelve null de forma segura cuando un modelo .glb no existe para activar el fallback procedural', () => {

    const loader = AssetLoader.getInstance();

    const piece = loader.getClonedPieceMeshSync(REALMS_CONFIG[0], 'k', 'w');

    expect(piece).toBeNull();



    const throne = loader.getClonedThroneSync('eternal_crown');

    expect(throne).toBeNull();

  });

});
