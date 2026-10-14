// src/core/ChessRules.ts

import { Chess, Move, Square } from 'chess.js';

import { MoveResult, PieceColor, PieceSymbol } from './types';



export class ChessRules {

  private chess: Chess;

  private redoStack: Move[] = [];



  constructor(initialFen?: string) {

    this.chess = initialFen ? new Chess(initialFen) : new Chess();

  }



  public getFen(): string {

    return this.chess.fen();

  }



  public getPgn(): string {

    return this.chess.pgn();

  }



  public loadFen(fen: string): boolean {

    try {

      this.chess.load(fen);

      this.redoStack = [];

      return true;

    } catch {

      return false;

    }

  }



  public getTurn(): PieceColor {

    return this.chess.turn();

  }



  public getLegalMoves(square?: string): Move[] {

    if (square) {

      return this.chess.moves({ square: square as Square, verbose: true });

    }

    return this.chess.moves({ verbose: true });

  }



  public isPromotionMove(from: string, to: string): boolean {

    const moves = this.getLegalMoves(from);

    return moves.some((m) => m.to === to && m.flags.includes('p'));

  }



  public makeMove(from: string, to: string, promotion: PieceSymbol = 'q'): MoveResult | null {

    const fenBefore = this.chess.fen();

    try {

      const move = this.chess.move({ from, to, promotion });

      if (!move) return null;



      this.redoStack = [];

      return {

        from: move.from,

        to: move.to,

        piece: move.piece as PieceSymbol,

        color: move.color as PieceColor,

        captured: move.captured as PieceSymbol | undefined,

        promotion: move.promotion as PieceSymbol | undefined,

        san: move.san,

        flags: move.flags,

        fenBefore,

        fenAfter: this.chess.fen(),

        isCheck: this.chess.inCheck(),

        isCheckmate: this.chess.isCheckmate(),

        isDraw: this.chess.isDraw(),

        isStalemate: this.chess.isStalemate(),

        isThreefoldRepetition: this.chess.isThreefoldRepetition(),

      };

    } catch {

      return null;

    }

  }



  public undo(): Move | null {

    const move = this.chess.undo();

    if (move) this.redoStack.push(move);

    return move;

  }



  public redo(): MoveResult | null {

    const move = this.redoStack.pop();

    if (!move) return null;

    return this.makeMove(move.from, move.to, (move.promotion as PieceSymbol) || 'q');

  }



  public isGameOver(): boolean {

    return this.chess.isGameOver();

  }



  public getHistory(): string[] {

    return this.chess.history();

  }



  public getBoardMatrix() {

    return this.chess.board();

  }

}
