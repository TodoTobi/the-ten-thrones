// src/core/ChessAI.ts

import { Chess, Move } from 'chess.js';

import { DifficultyLevel } from './types';



interface DifficultyProfile {

  depth: number;

  blunderChance: number;     // Selección entre las top N jugadas legales (nunca ilegales ni ignorando mate en 1)

  topCandidatePool: number;

  thinkTimeMinMs: number;

}



const DIFFICULTY_PROFILES: Record<DifficultyLevel, DifficultyProfile> = {

  beginner:     { depth: 1, blunderChance: 0.45, topCandidatePool: 4, thinkTimeMinMs: 500 },

  easy:         { depth: 2, blunderChance: 0.25, topCandidatePool: 3, thinkTimeMinMs: 650 },

  intermediate: { depth: 3, blunderChance: 0.10, topCandidatePool: 2, thinkTimeMinMs: 800 },

  advanced:     { depth: 3, blunderChance: 0.00, topCandidatePool: 1, thinkTimeMinMs: 950 },

  expert:       { depth: 4, blunderChance: 0.00, topCandidatePool: 1, thinkTimeMinMs: 1100 },

  master:       { depth: 5, blunderChance: 0.00, topCandidatePool: 1, thinkTimeMinMs: 1300 },

};



const PIECE_VALUES: Record<string, number> = {

  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000

};



// Tablas posicionales (perspectiva blancas)

const PAWN_PST = [

   0,  0,  0,  0,  0,  0,  0,  0,

  50, 50, 50, 50, 50, 50, 50, 50,

  10, 10, 20, 30, 30, 20, 10, 10,

   5,  5, 10, 25, 25, 10,  5,  5,

   0,  0,  0, 20, 20,  0,  0,  0,

   5, -5,-10,  0,  0,-10, -5,  5,

   5, 10, 10,-20,-20, 10, 10,  5,

   0,  0,  0,  0,  0,  0,  0,  0

];



const KNIGHT_PST = [

  -50,-40,-30,-30,-30,-30,-40,-50,

  -40,-20,  0,  0,  0,  0,-20,-40,

  -30,  0, 10, 15, 15, 10,  0,-30,

  -30,  5, 15, 20, 20, 15,  5,-30,

  -30,  0, 15, 20, 20, 15,  0,-30,

  -30,  5, 10, 15, 15, 10,  5,-30,

  -40,-20,  0,  5,  5,  0,-20,-40,

  -50,-40,-30,-30,-30,-30,-40,-50,

];



export class ChessAI {

  private cancelled = false;

  private stockfishWorker: Worker | null = null;



  constructor() {

    this.tryInitStockfish();

  }



  private tryInitStockfish(): void {

    try {

      // Si existe stockfish.js en public/, se enlaza automáticamente

      this.stockfishWorker = new Worker('/stockfish/stockfish.js');

      this.stockfishWorker.onerror = () => {

        this.stockfishWorker = null;

      };

    } catch {

      this.stockfishWorker = null;

    }

  }



  public cancelSearch(): void {

    this.cancelled = true;

    if (this.stockfishWorker) {

      this.stockfishWorker.postMessage('stop');

    }

  }



  public evaluatePositionStatic(chess: Chess): number {

    if (chess.isCheckmate()) {

      return chess.turn() === 'w' ? -99999 : 99999;

    }

    if (chess.isDraw()) return 0;



    const board = chess.board();

    let score = 0;



    for (let r = 0; r < 8; r++) {

      for (let c = 0; c < 8; c++) {

        const piece = board[r][c];

        if (!piece) continue;



        const base = PIECE_VALUES[piece.type] || 0;

        const sqIndex = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

        let positional = 0;

        if (piece.type === 'p') positional = PAWN_PST[sqIndex];

        if (piece.type === 'n' || piece.type === 'b') positional = KNIGHT_PST[sqIndex];



        const total = base + positional;

        score += piece.color === 'w' ? total : -total;

      }

    }

    return score;

  }



  public async findBestMove(

    fen: string,

    difficulty: DifficultyLevel,

    aggressionWeight = 1.0

  ): Promise<{ move: Move; score: number }> {

    this.cancelled = false;

    const profile = DIFFICULTY_PROFILES[difficulty];

    const startTime = performance.now();



    const chess = new Chess(fen);

    const legalMoves = chess.moves({ verbose: true });

    if (legalMoves.length === 0) {

      throw new Error('No legal moves available for AI');

    }



    // ceder frame al navegador antes de calcular

    await new Promise((r) => setTimeout(r, 30));



    const scoredMoves: { move: Move; score: number }[] = [];

    const isMaximizing = chess.turn() === 'w';



    // Ordenar movimientos por capturas (MVV-LVA) para acelerar Alfa-Beta

    const orderedMoves = [...legalMoves].sort((a, b) => {

      const scoreA = a.captured ? PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece] : 0;

      const scoreB = b.captured ? PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece] : 0;

      return scoreB - scoreA;

    });



    for (const move of orderedMoves) {

      if (this.cancelled) break;

      chess.move(move);



      // Si da jaque mate inmediato, seleccionarlo siempre sin importar el nivel

      if (chess.isCheckmate()) {

        chess.undo();

        return { move, score: isMaximizing ? 99999 : -99999 };

      }



      const rawScore = this.minimax(

        chess,

        profile.depth - 1,

        -Infinity,

        Infinity,

        !isMaximizing

      );



      // Bonificación sutil según agresividad del reino

      const aggressionBonus = (move.captured || chess.inCheck())

        ? (isMaximizing ? 15 : -15) * (aggressionWeight - 1)

        : 0;



      scoredMoves.push({ move, score: rawScore + aggressionBonus });

      chess.undo();

    }



    scoredMoves.sort((a, b) => (isMaximizing ? b.score - a.score : a.score - b.score));



    let chosen = scoredMoves[0];

    if (

      scoredMoves.length > 1 &&

      Math.random() < profile.blunderChance

    ) {

      const poolSize = Math.min(profile.topCandidatePool, scoredMoves.length);

      // Nunca elegir una jugada que permita mate inmediato si hay otra opción

      const safeCandidates = scoredMoves.slice(0, poolSize).filter(c => Math.abs(c.score) < 50000);

      if (safeCandidates.length > 0) {

        chosen = safeCandidates[Math.floor(Math.random() * safeCandidates.length)];

      }

    }



    const elapsed = performance.now() - startTime;

    if (elapsed < profile.thinkTimeMinMs && !this.cancelled) {

      await new Promise((r) => setTimeout(r, profile.thinkTimeMinMs - elapsed));

    }



    return chosen;

  }



  private minimax(

    chess: Chess,

    depth: number,

    alpha: number,

    beta: number,

    maximizingPlayer: boolean

  ): number {

    if (this.cancelled || depth === 0 || chess.isGameOver()) {

      return this.evaluatePositionStatic(chess);

    }



    const moves = chess.moves({ verbose: true });

    if (maximizingPlayer) {

      let maxEval = -Infinity;

      for (const move of moves) {

        chess.move(move);

        const evaluation = this.minimax(chess, depth - 1, alpha, beta, false);

        chess.undo();

        maxEval = Math.max(maxEval, evaluation);

        alpha = Math.max(alpha, evaluation);

        if (beta <= alpha) break;

      }

      return maxEval;

    } else {

      let minEval = Infinity;

      for (const move of moves) {

        chess.move(move);

        const evaluation = this.minimax(chess, depth - 1, alpha, beta, true);

        chess.undo();

        minEval = Math.min(minEval, evaluation);

        beta = Math.min(beta, evaluation);

        if (beta <= alpha) break;

      }

      return minEval;

    }

  }

}
