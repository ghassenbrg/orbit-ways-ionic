import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Board, Cell, Line, Move } from '../../service/game-engine.service';
import { GameEngineService } from '../../service/game-engine.service';
import { FlowMode, hexA, Palette, Side, TokenKey } from '../theme';

const CELL = 64;
const GAP = 12;
const PAD = 18;
const BOARD = PAD * 2 + 4 * CELL + 3 * GAP; // 328

/** Chunky mobile-game board: etched orbit raceways, flow chevrons, character
 *  tokens that glide one station along their lane when the board orbits. */
@Component({
  selector: 'ow-board',
  standalone: false,
  template: `
    <div class="ow-board" [ngStyle]="boardStyle">
      <!-- orbit raceways -->
      <div class="ow-raceways">
        <div [ngStyle]="raceStyle('outer')"></div>
        <div [ngStyle]="raceStyle('inner')"></div>
      </div>

      <!-- stations -->
      <ng-container *ngFor="let row of board; let r = index">
        <div *ngFor="let cell of row; let c = index"
             class="ow-station" [ngStyle]="stationStyle(r, c, cell)"
             (click)="onCell(r, c, cell)">
          <svg *ngIf="flowMode !== 'hidden'" width="22" height="22" viewBox="0 0 22 22"
               [ngStyle]="chevronStyle(r, c)">
            <path d="M7 4 L15 11 L7 18" fill="none" stroke="#fff"
              stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </ng-container>

      <!-- tokens -->
      <ng-container *ngFor="let row of board; let r = index">
        <ng-container *ngFor="let cell of row; let c = index">
          <div *ngIf="cell" class="ow-token" [ngStyle]="tokenWrapStyle(r, c)">
            <div *ngIf="isWin(r, c)" class="ow-winring" [ngStyle]="winRingStyle"></div>
            <div class="ow-token-anim" [style.animation]="innerAnim(r, c)">
              <ow-piece [side]="cell" [tokens]="tokens" [colors]="colors" [size]="sz"></ow-piece>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `,
  styles: [`
    .ow-board { position: relative; }
    .ow-raceways { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
    .ow-raceways > div { position: absolute; transition: border-color .25s; }
    .ow-station {
      position: absolute; display: flex; align-items: center; justify-content: center;
      transition: background .2s;
    }
    .ow-station svg { transition: opacity .25s; }
    .ow-token { position: absolute; }
    .ow-token-anim { width: 100%; height: 100%; }
    .ow-winring { position: absolute; border-radius: 50%; }
  `],
})
export class BoardComponent implements OnChanges {
  @Input() board: Board = [];
  @Input() moves: (Move | null)[][] | null = null;
  @Input() colors!: Palette;
  @Input() flowMode: FlowMode = 'bold';
  @Input() tokens: TokenKey = 'astro';
  @Input() winLines: Line[] = [];
  @Input() lastPlaced: { r: number; c: number } | null = null;
  @Input() duration = 640;
  @Input() disabled = false;
  @Input() current: Side = 'B';
  @Output() place = new EventEmitter<{ r: number; c: number }>();

  readonly sz = CELL * 0.78;
  private go = false;
  private rafId = 0;

  constructor(private engine: GameEngineService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['moves']) {
      cancelAnimationFrame(this.rafId);
      if (this.moves) {
        // Two RAFs: paint tokens at origin, THEN flip transforms so the CSS
        // transition actually animates the glide.
        this.go = false;
        this.rafId = requestAnimationFrame(() =>
          (this.rafId = requestAnimationFrame(() => (this.go = true)))
        );
      } else {
        this.go = false;
      }
    }
  }

  get flowing(): boolean {
    return !!this.moves;
  }

  private centerOf(r: number, c: number): { x: number; y: number } {
    return { x: PAD + c * (CELL + GAP) + CELL / 2, y: PAD + r * (CELL + GAP) + CELL / 2 };
  }

  private get winSet(): Set<string> {
    const s = new Set<string>();
    (this.winLines || []).forEach((line) => line.forEach(([r, c]) => s.add(`${r}${c}`)));
    return s;
  }

  isWin(r: number, c: number): boolean {
    return this.winSet.has(`${r}${c}`);
  }

  isNew(r: number, c: number): boolean {
    return !!this.lastPlaced && this.lastPlaced.r === r && this.lastPlaced.c === c && !this.flowing;
  }

  onCell(r: number, c: number, cell: Cell): void {
    if (!this.disabled && !cell) this.place.emit({ r, c });
  }

  get boardStyle(): Record<string, string> {
    return {
      position: 'relative',
      width: `${BOARD}px`,
      height: `${BOARD}px`,
      'border-radius': '30px',
      background: `linear-gradient(180deg, ${hexA('#ffffff', 0.1)}, ${hexA('#000000', 0.22)})`,
      border: `3px solid ${hexA('#ffffff', 0.18)}`,
      'box-shadow':
        `inset 0 2px 0 ${hexA('#ffffff', 0.18)}, 0 10px 0 ${hexA('#000000', 0.28)}, 0 22px 40px ${hexA('#000000', 0.45)}`,
    };
  }

  raceStyle(which: 'outer' | 'inner'): Record<string, string> {
    const a = which === 'outer' ? this.centerOf(0, 0) : this.centerOf(1, 1);
    const b = which === 'outer' ? this.centerOf(3, 3) : this.centerOf(2, 2);
    const rad = which === 'outer' ? CELL / 2 + GAP : CELL / 2;
    const color = this.colors[this.current] || this.colors.B;
    return {
      left: `${a.x}px`,
      top: `${a.y}px`,
      width: `${b.x - a.x}px`,
      height: `${b.y - a.y}px`,
      'border-radius': `${rad}px`,
      border: `3px dashed ${hexA(this.flowing ? color : '#ffffff', this.flowing ? 0.7 : 0.16)}`,
    };
  }

  stationStyle(r: number, c: number, cell: Cell): Record<string, string> {
    const { x, y } = this.centerOf(r, c);
    return {
      left: `${x - CELL / 2}px`,
      top: `${y - CELL / 2}px`,
      width: `${CELL}px`,
      height: `${CELL}px`,
      'border-radius': '17px',
      'z-index': '2',
      background: hexA('#ffffff', 0.06),
      border: `2px solid ${hexA('#ffffff', 0.12)}`,
      'box-shadow': `inset 0 -3px 0 ${hexA('#000000', 0.18)}, inset 0 2px 2px ${hexA('#ffffff', 0.1)}`,
      cursor: !this.disabled && !cell ? 'pointer' : 'default',
    };
  }

  chevronStyle(r: number, c: number): Record<string, string> {
    const op = this.flowing ? 1 : this.flowMode === 'bold' ? 0.5 : 0.2;
    return {
      transform: `rotate(${this.engine.degOf(r, c)}deg)`,
      opacity: `${op}`,
    };
  }

  tokenWrapStyle(r: number, c: number): Record<string, string> {
    const here = this.centerOf(r, c);
    let dx = 0;
    let dy = 0;
    if (this.go && this.moves && this.moves[r][c]) {
      const m = this.moves[r][c] as Move;
      const dest = this.centerOf(m.toR, m.toC);
      dx = dest.x - here.x;
      dy = dest.y - here.y;
    }
    return {
      left: `${here.x - this.sz / 2}px`,
      top: `${here.y - this.sz / 2}px`,
      width: `${this.sz}px`,
      height: `${this.sz}px`,
      'z-index': this.isWin(r, c) ? '6' : '5',
      'pointer-events': 'none',
      transform: `translate(${dx}px, ${dy}px)`,
      transition: this.go ? `transform ${this.duration}ms cubic-bezier(.34,1.4,.5,1)` : 'none',
    };
  }

  get winRingStyle(): Record<string, string> {
    const d = this.sz + 18;
    return {
      left: '50%',
      top: '50%',
      width: `${d}px`,
      height: `${d}px`,
      'margin-left': `${-d / 2}px`,
      'margin-top': `${-d / 2}px`,
      border: '4px solid #ffe27a',
      'box-shadow': `0 0 16px ${hexA('#ffe27a', 0.9)}`,
      animation: 'ow-winring .8s ease-in-out infinite',
    };
  }

  innerAnim(r: number, c: number): string {
    if (this.isWin(r, c)) return 'ow-winbounce .7s ease-in-out infinite';
    if (this.isNew(r, c)) return 'ow-drop .4s cubic-bezier(.3,1.6,.5,1) both';
    return 'none';
  }
}
