// src/__tests__/chessCore.test.ts

import { describe, it, expect } from 'vitest';

import { ChessRules } from '../core/ChessRules';

import { ChessAI } from '../core/ChessAI';



describe('THE TEN THRONES — Verificación de Reglas e IA', () => {

  it('Permite movimientos legales y rechaza movimientos ilegales', () => {

    const rules = new ChessRules();

    expect(rules.makeMove('e2', 'e4')).not.toBeNull();

    expect(rules.makeMove('e7', 'e3')).toBeNull(); // Movimiento ilegal de peón negro

  });



  it('Detecta Jaque Mate correctamente (Mate del Loco)', () => {

    const rules = new ChessRules();

    rules.makeMove('f2', 'f3');

    rules.makeMove('e7', 'e5');

    rules.makeMove('g2', 'g4');

    const mateMove = rules.makeMove('d8', 'h4');

    expect(mateMove?.isCheckmate).toBe(true);

    expect(rules.isGameOver()).toBe(true);

  });



  it('Verifica Enroque y Captura al Paso según reglas FIDE', () => {

    // Posición lista para captura al paso

    const rules = new ChessRules('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');

    const ep = rules.makeMove('e5', 'd6');

    expect(ep).not.toBeNull();

    expect(ep?.flags).toContain('e');

  });



  it('La IA encuentra jaque mate en 1 de forma determinista', async () => {

    const ai = new ChessAI();

    // Negras dan mate en h4

    const fen = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2';

    const RulesCheck = new ChessRules('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2');

    const res = await ai.findBestMove(RulesCheck.getFen(), 'intermediate');

    expect(res.move.san).toBe('Qh4#');

  });

});
