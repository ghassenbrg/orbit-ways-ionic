import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { GameConfigService, GameMode } from 'src/app/service/game-config.service';
import { Board, Evaluation, GameEngineService, Line, Move } from 'src/app/service/game-engine.service';
import { SettingsService } from 'src/app/service/settings.service';
import { WebsocketService } from 'src/app/service/websocket.service';
import {
  fieldBackground,
  FlowMode,
  hexA,
  Palette,
  shade,
  Side,
  TokenKey,
} from 'src/app/shared/theme';

type Phase = 'idle' | 'orbiting' | 'roundover' | 'matchover';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: false,
})
export class GamePage implements OnInit, OnDestroy {
  // ── Match config ──
  mode: GameMode = 'local';
  roomCode = '';
  maxScore = 3;
  mySide: Side = 'B';
  myName = 'You';

  // ── Visual state (from settings) ──
  colors!: Palette;
  tokens: TokenKey = 'astro';
  flowMode: FlowMode = 'bold';
  starfield = true;
  duration = 640;
  fieldBg = '';

  // ── Game state ──
  board: Board = [];
  current: Side = 'B';
  phase: Phase = 'idle';
  moves: (Move | null)[][] | null = null;
  lastPlaced: { r: number; c: number } | null = null;
  winner: Side | null | undefined = undefined;
  winLines: Line[] = [];
  score: Record<Side, number> = { B: 0, W: 0 };
  players: Record<Side, string> = { B: 'Player 1', W: 'Player 2' };
  burst: { key: number; color: string; big: boolean } | null = null;
  copied = false;
  showKana = false;

  // ── Online plumbing ──
  private boardclientId = '';
  private subscribed = false;
  private pendingState: any = null;
  private t1: any = null;
  private t2: any = null;
  private settingsSub?: Subscription;
  private connSub?: Subscription;

  readonly sides: Side[] = ['B', 'W'];

  constructor(
    private nav: NavController,
    private http: HttpClient,
    private ws: WebsocketService,
    private settings: SettingsService,
    private config: GameConfigService,
    private engine: GameEngineService
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    this.subscribeSettings();
    const opts = await this.config.restore();
    if (!opts) {
      this.nav.navigateRoot('/room');
      return;
    }
    this.mode = opts.mode;
    this.roomCode = opts.roomCode;
    this.maxScore = opts.maxScore;
    this.mySide = opts.mySide;
    this.myName = opts.myName;
    this.board = this.engine.emptyBoard();
    this.score = { B: 0, W: 0 };
    this.current = 'B';
    this.phase = 'idle';

    if (this.mode === 'local') {
      const other: Side = this.mySide === 'B' ? 'W' : 'B';
      this.players = { B: '', W: '' } as Record<Side, string>;
      this.players[this.mySide] = this.myName;
      this.players[other] = 'Rival';
    } else {
      this.players = { B: 'Black', W: 'White' };
      this.initOnline();
    }

    this.checkKana();
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.settingsSub?.unsubscribe();
    this.connSub?.unsubscribe();
    if (this.mode === 'online') this.ws.disconnect();
  }

  private subscribeSettings(): void {
    this.settingsSub = this.settings.settings$.subscribe((s) => {
      this.colors = this.settings.colors;
      this.tokens = s.tokens;
      this.flowMode = s.flowMode;
      this.starfield = s.starfield;
      this.duration = this.settings.duration;
      this.fieldBg = fieldBackground(this.colors);
    });
  }

  private clearTimers(): void {
    if (this.t1) clearTimeout(this.t1);
    if (this.t2) clearTimeout(this.t2);
    this.t1 = this.t2 = null;
  }

  // ── Shared orbit animation ──────────────────────────────────────────────
  // Sets the placed board, plays the orbit glide, settles to the next board,
  // then runs `onSettle(next)`. Faithful to the design's place() timing.
  private animateOrbit(
    placed: Board,
    last: { r: number; c: number },
    onSettle: (next: Board) => void
  ): void {
    this.clearTimers();
    this.board = placed;
    this.lastPlaced = last;
    this.moves = null;
    this.phase = 'orbiting';
    const { next, moves } = this.engine.orbitStep(placed);
    this.t1 = setTimeout(() => {
      this.moves = moves;
      this.t2 = setTimeout(() => {
        this.board = next;
        this.moves = null;
        onSettle(next);
      }, this.duration + 60);
    }, 200);
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  place(r: number, c: number): void {
    if (this.boardDisabled || this.board[r][c]) return;
    if (this.mode === 'local') this.placeLocal(r, c);
    else this.placeOnline(r, c);
  }

  private placeLocal(r: number, c: number): void {
    const placed = this.board.map((row) => row.slice());
    placed[r][c] = this.current;
    this.animateOrbit(placed, { r, c }, (next) => {
      const res = this.engine.evaluate(next);
      if (res.winner !== undefined) this.finishRoundLocal(res);
      else {
        this.current = this.current === 'B' ? 'W' : 'B';
        this.phase = 'idle';
      }
    });
  }

  private finishRoundLocal(res: Evaluation): void {
    this.winner = res.winner;
    this.winLines = res.lines;
    if (res.winner) {
      const ns = { ...this.score, [res.winner]: this.score[res.winner] + 1 };
      this.score = ns;
      const big = ns[res.winner] >= this.maxScore;
      this.burst = { key: Date.now(), color: this.colors[res.winner], big };
      this.phase = big ? 'matchover' : 'roundover';
    } else {
      this.phase = 'roundover';
    }
  }

  private placeOnline(r: number, c: number): void {
    const placed = this.board.map((row) => row.slice());
    placed[r][c] = this.mySide;
    this.animateOrbit(placed, { r, c }, () => this.settleOnline());
    this.ws.send('/app/placeMarble', {
      roomId: this.roomCode,
      userId: this.myName,
      row: r,
      col: c,
      boardclientId: this.boardclientId,
    });
  }

  private settleOnline(): void {
    if (this.pendingState) {
      const s = this.pendingState;
      this.pendingState = null;
      this.applyServerState(s, false);
    } else {
      this.phase = 'idle';
      this.winner = undefined;
      this.winLines = [];
    }
  }

  // ── Round / match controls ───────────────────────────────────────────────
  nextRound(): void {
    if (this.mode === 'online') {
      this.ws.send('/app/resetGame', { roomId: this.roomCode, fullReset: false });
      return;
    }
    const starter: Side = this.winner
      ? this.winner === 'B' ? 'W' : 'B'
      : this.current === 'B' ? 'W' : 'B';
    this.board = this.engine.emptyBoard();
    this.current = starter;
    this.phase = 'idle';
    this.moves = null;
    this.winner = undefined;
    this.winLines = [];
    this.lastPlaced = null;
    this.burst = null;
  }

  resetMatch(): void {
    if (this.mode === 'online') {
      this.ws.send('/app/resetGame', { roomId: this.roomCode, fullReset: true });
      return;
    }
    this.board = this.engine.emptyBoard();
    this.score = { B: 0, W: 0 };
    this.current = 'B';
    this.phase = 'idle';
    this.moves = null;
    this.winner = undefined;
    this.winLines = [];
    this.lastPlaced = null;
    this.burst = null;
  }

  rematch(): void {
    this.resetMatch();
  }

  async quit(): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur();
    this.clearTimers();
    if (this.mode === 'online') this.ws.disconnect();
    await this.config.clear();
    this.nav.navigateRoot('/room', { animationDirection: 'back' });
  }

  copyCode(): void {
    try {
      navigator.clipboard && navigator.clipboard.writeText(this.roomCode);
    } catch {
      /* clipboard unavailable */
    }
    this.copied = true;
    setTimeout(() => (this.copied = false), 1500);
  }

  // ── Kana easter egg ──
  private checkKana(): void {
    if ((this.myName || '').toLowerCase() === 'babe25') this.showKana = true;
  }
  dismissKana(): void {
    this.showKana = false;
  }

  // ── Online networking ───────────────────────────────────────────────────
  private initOnline(): void {
    this.boardclientId = uuidv4();
    this.ws.connect();
    this.connSub = this.ws.isConnected().subscribe((connected) => {
      if (connected && !this.subscribed) {
        this.subscribed = true;
        this.ws.subscribe(`/topic/room/${this.roomCode}`, (s: any) => this.onFullState(s));
        this.ws.subscribe(`/topic/room/${this.roomCode}/placeMarble`, (b: any) =>
          this.onPlaceReceived(b)
        );
      }
    });
    this.http
      .get<any>(`${this.settings.apiBase()}/api/game/get?roomId=${this.roomCode}`)
      .subscribe({
        next: (g) => this.onFullState(g),
        error: () => {
          /* no existing state yet — wait for broadcasts */
        },
      });
  }

  private onFullState(state: any): void {
    if (!state) return;
    this.clearTimers();
    this.moves = null;
    this.applyServerState(state, true);
  }

  private onPlaceReceived(body: any): void {
    const mm = body?.marbleMessage;
    if (!mm) {
      this.applyServerState(body, false);
      return;
    }
    const isMine = mm.boardclientId === this.boardclientId;
    if (isMine) {
      if (this.phase === 'orbiting') this.pendingState = body;
      else this.applyServerState(body, false);
      return;
    }
    // Opponent's move: animate it, then apply the server result on settle.
    const side: Side = body.playerBlack === mm.userId ? 'B' : 'W';
    const placed = this.board.map((row) => row.slice());
    placed[mm.row][mm.col] = side;
    this.pendingState = body;
    this.animateOrbit(placed, { r: mm.row, c: mm.col }, () => this.settleOnline());
  }

  private applyServerState(body: any, updateBoard: boolean): void {
    if (body.currentPlayer) this.current = body.currentPlayer;
    if (body.maxScore != null) this.maxScore = body.maxScore;
    this.players = {
      B: this.displayName(body.playerBlack || 'Black'),
      W: this.displayName(body.playerWhite || 'White'),
    };
    this.score = { B: body.blackScore || 0, W: body.whiteScore || 0 };
    if (updateBoard) this.board = this.engine.normalize(body.board);

    if (body.matchDone) {
      const w = body.finalWinner as Side;
      this.winner = w;
      this.winLines = this.engine.winLinesFor(this.board, w);
      this.burst = { key: Date.now(), color: this.colors[w], big: true };
      this.phase = 'matchover';
    } else if (body.gameOver) {
      const w = (body.winner ?? null) as Side | null;
      this.winner = w;
      this.winLines = w ? this.engine.winLinesFor(this.board, w) : [];
      this.burst = w ? { key: Date.now(), color: this.colors[w], big: false } : null;
      this.phase = 'roundover';
    } else {
      this.winner = undefined;
      this.winLines = [];
      this.burst = null;
      this.phase = 'idle';
    }
  }

  private displayName(name: string): string {
    return name === this.myName ? 'You' : name;
  }

  // ── Derived view state ────────────────────────────────────────────────────
  get boardDisabled(): boolean {
    if (this.phase !== 'idle') return true;
    if (this.mode === 'online') return this.current !== this.mySide;
    return false;
  }

  playerActive(side: Side): boolean {
    return this.current === side && this.phase !== 'matchover';
  }

  get roundColor(): string {
    return this.winner ? this.colors[this.winner] : '#ffd23f';
  }

  get roundMsg(): string {
    return this.winner ? `${this.players[this.winner]} wins the round!` : "It's a tie!";
  }

  get matchNameShadow(): string {
    return this.winner ? shade(this.colors[this.winner], -0.4) : '';
  }

  // ── Style builders ──
  playerCardStyle(side: Side): Record<string, string> {
    const color = this.colors[side];
    const active = this.playerActive(side);
    return {
      background: active ? hexA(color, 0.2) : hexA('#ffffff', 0.05),
      border: `2.5px solid ${active ? color : hexA('#ffffff', 0.1)}`,
      'box-shadow': active
        ? `0 4px 0 ${shade(color, -0.45)}, 0 0 20px ${hexA(color, 0.4)}`
        : `0 3px 0 ${hexA('#000', 0.2)}`,
    };
  }

  turnPillStyle(): Record<string, string> {
    const color = this.colors[this.current];
    return {
      background: hexA(color, 0.22),
      border: `2.5px solid ${color}`,
      'box-shadow': `0 4px 0 ${shade(color, -0.45)}`,
    };
  }

  roundPillStyle(): Record<string, string> {
    const color = this.roundColor;
    return {
      background: hexA(color, 0.2),
      border: `2.5px solid ${color}`,
      'box-shadow': `0 4px 0 ${shade(color, -0.45)}`,
    };
  }

  matchOverlayStyle(): Record<string, string> {
    const color = this.winner ? this.colors[this.winner] : '#ffd23f';
    return {
      background: `radial-gradient(circle at 50% 42%, ${hexA(color, 0.3)}, ${hexA('#0c0820', 0.94)} 72%)`,
    };
  }
}
