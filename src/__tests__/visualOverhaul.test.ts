// src/__tests__/visualOverhaul.test.ts
import { describe, it, expect } from 'vitest';
import { EXPRESSION_PRESETS } from '../rendering/RivalAvatar2D';
import { ChessRules } from '../core/ChessRules';
import { ChessAI } from '../core/ChessAI';
import { Chess } from 'chess.js';

describe('THE TEN THRONES — AAA Visual & Acting Rig Verification', () => {
  it('Provides distinct parametric channel configurations for all 18 required emotional expressions', () => {
    const keys = Object.keys(EXPRESSION_PRESETS);
    expect(keys.length).toBeGreaterThanOrEqual(18);
    expect(EXPRESSION_PRESETS.arrogant_smirk.mouthCornerRightY).toBeGreaterThan(0.5);
    expect(EXPRESSION_PRESETS.open_anger.browInnerLeftY).toBeLessThan(-0.8);
    expect(EXPRESSION_PRESETS.defeat.leftEyelidUpper).toBeGreaterThan(0.6);
  });

  it('Substantiates tactical blunders via real centipawn evaluation delta', () => {
    const ai = new ChessAI();
    const rules = new ChessRules('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5Q2/PPPP1PPP/RNB1KBNR w KQkq - 2 3');
    const before = ai.evaluatePositionStatic(new Chess(rules.getFen()));

    // Blundering the Queen onto f6 where Knight on g8 captures it
    const move = rules.makeMove('f3', 'f6');
    expect(move).not.toBeNull();
    // Simulate opponent capturing the hung Queen
    rules.makeMove('g8', 'f6');
    const afterExchange = ai.evaluatePositionStatic(new Chess(rules.getFen()));

    expect(afterExchange - before).toBeLessThan(-700);
  });
});
