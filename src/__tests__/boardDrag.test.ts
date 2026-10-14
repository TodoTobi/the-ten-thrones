// src/__tests__/boardDrag.test.ts

import { describe, it, expect } from 'vitest';

import * as THREE from 'three';



// Función pura equivalente a la proyección bidireccional de Board3D

const squareToWorld = (square: string): THREE.Vector3 => {

  const file = square.charCodeAt(0) - 97;

  const rank = 8 - parseInt(square[1], 10);

  return new THREE.Vector3(file - 3.5, 0.06, rank - 3.5);

};



const worldToSquare = (point: THREE.Vector3): string | null => {

  const col = Math.floor(point.x + 4.0);

  const row = Math.floor(point.z + 4.0);

  if (col < 0 || col > 7 || row < 0 || row > 7) return null;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return `${files[col]}${8 - row}`;

};



describe('THE TEN THRONES — Intersección de Plano Horizontal y Drag & Drop', () => {

  it('Mapea de forma biyectiva las 64 casillas entre coordenadas 3D y notación algebraica', () => {

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (const f of files) {

      for (let r = 1; r <= 8; r++) {

        const sq = `${f}${r}`;

        const worldPos = squareToWorld(sq);

        expect(worldToSquare(worldPos)).toBe(sq);

      }

    }

  });



  it('Devuelve null cuando el cursor arrastra una pieza fuera de los bordes del tablero', () => {

    expect(worldToSquare(new THREE.Vector3(-4.2, 0.06, 0))).toBeNull();

    expect(worldToSquare(new THREE.Vector3(0, 0.06, 4.5))).toBeNull();

  });

});
