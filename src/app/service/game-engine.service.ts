import { Injectable } from '@angular/core';
import { Side } from '../shared/theme';

export type Cell = Side | null;
export type Board = Cell[][];
export type Line = [number, number][];
export interface Move {
  toR: number;
  toC: number;
}
export interface OrbitResult {
  next: Board;
  moves: (Move | null)[][];
}
export interface Evaluation {
  /** undefined = keep playing · null = tie · 'B'/'W' = winner */
  winner: Side | null | undefined;
  lines: Line[];
}

type Dir = 'up' | 'down' | 'left' | 'right';

/**
 * Pure game logic for Orbit Ways. The board is 4x4; every cell pushes its
 * occupant one station along a fixed clockwise flow (two concentric rings).
 *
 * Faithful to the original Angular source's arrowDirectionGrid + directionMap
 * (verified cell-for-cell against the design bundle's orbit-engine.jsx).
 */
@Injectable({ providedIn: 'root' })
export class GameEngineService {
  // Direction each cell pushes its piece.
  //   down  (dr+1): 00 10 20 11
  //   left  (dc-1): 01 02 03 12
  //   up    (dr-1): 33 23 13 22
  //   right (dc+1): 30 31 32 21
  private readonly ORBIT_DIRS: Record<Dir, string[]> = {
    down: ['00', '10', '20', '11'],
    left: ['01', '02', '03', '12'],
    up: ['33', '23', '13', '22'],
    right: ['30', '31', '32', '21'],
  };

  readonly DIR_VEC: Record<Dir, { dr: number; dc: number; deg: number }> = {
    right: { dr: 0, dc: 1, deg: 0 },
    down: { dr: 1, dc: 0, deg: 90 },
    left: { dr: 0, dc: -1, deg: 180 },
    up: { dr: -1, dc: 0, deg: -90 },
  };

  dirOf(r: number, c: number): Dir {
    const key = `${r}${c}`;
    for (const d of Object.keys(this.ORBIT_DIRS) as Dir[]) {
      if (this.ORBIT_DIRS[d].includes(key)) return d;
    }
    return 'right';
  }

  /** Arrow rotation (degrees) drawn in a cell to show its flow direction. */
  degOf(r: number, c: number): number {
    return this.DIR_VEC[this.dirOf(r, c)].deg;
  }

  emptyBoard(): Board {
    return Array.from({ length: 4 }, () => Array<Cell>(4).fill(null));
  }

  /** Normalise a server board (cells may be the string 'EMPTY') into nulls. */
  normalize(board: any[][] | null | undefined): Board {
    if (!board) return this.emptyBoard();
    return board.map((row) =>
      row.map((cell) => (cell === 'B' || cell === 'W' ? (cell as Side) : null))
    );
  }

  /** Advance the board one orbit step. Returns the next board + per-cell moves. */
  orbitStep(board: Board): OrbitResult {
    const next = this.emptyBoard();
    const moves: (Move | null)[][] = Array.from({ length: 4 }, () =>
      Array<Move | null>(4).fill(null)
    );
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const { dr, dc } = this.DIR_VEC[this.dirOf(r, c)];
        const nr = (r + dr + 4) % 4;
        const nc = (c + dc + 4) % 4;
        next[nr][nc] = board[r][c];
        moves[r][c] = { toR: nr, toC: nc };
      }
    }
    return { next, moves };
  }

  /** All winning 4-in-a-row lines, grouped by colour. */
  findWins(board: Board): { B: Line[]; W: Line[] } {
    const lines: Line[] = [];
    for (let r = 0; r < 4; r++) lines.push([[r, 0], [r, 1], [r, 2], [r, 3]]);
    for (let c = 0; c < 4; c++) lines.push([[0, c], [1, c], [2, c], [3, c]]);
    lines.push([[0, 0], [1, 1], [2, 2], [3, 3]]);
    lines.push([[0, 3], [1, 2], [2, 1], [3, 0]]);

    const wins: { B: Line[]; W: Line[] } = { B: [], W: [] };
    for (const line of lines) {
      const v = board[line[0][0]][line[0][1]];
      if (!v) continue;
      if (line.every(([r, c]) => board[r][c] === v)) wins[v].push(line);
    }
    return wins;
  }

  /** Decide round outcome after an orbit settles. */
  evaluate(board: Board): Evaluation {
    const wins = this.findWins(board);
    const bWin = wins.B.length > 0;
    const wWin = wins.W.length > 0;
    if (bWin && wWin) return { winner: null, lines: [...wins.B, ...wins.W] };
    if (bWin) return { winner: 'B', lines: wins.B };
    if (wWin) return { winner: 'W', lines: wins.W };
    const full = board.every((row) => row.every((c) => c));
    if (full) return { winner: null, lines: [] };
    return { winner: undefined, lines: [] };
  }

  /** Winning lines for a known winning side (used to highlight online wins). */
  winLinesFor(board: Board, side: Side | null): Line[] {
    if (!side) return [];
    return this.findWins(board)[side];
  }

  randomRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
}
