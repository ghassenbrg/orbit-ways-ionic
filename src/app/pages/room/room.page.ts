import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameConfigService } from 'src/app/service/game-config.service';
import { GameEngineService } from 'src/app/service/game-engine.service';
import { SettingsService } from 'src/app/service/settings.service';
import { fieldBackground, hexA, Palette, shade, Side, TOKEN_SETS, TokenKey } from 'src/app/shared/theme';

type LobbyMode = 'local' | 'create' | 'join';

@Component({
  selector: 'app-room',
  templateUrl: './room.page.html',
  styleUrls: ['./room.page.scss'],
  standalone: false,
})
export class RoomPage implements OnInit, OnDestroy {
  // Visual state (from settings).
  colors!: Palette;
  tokens!: TokenKey;
  starfield = true;
  fieldBg = '';

  // Lobby form state.
  mode: LobbyMode | null = null;
  name = '';
  code = '';
  rounds = 3;
  side: Side = 'B';
  genCode = '';
  err = '';
  busy = false;

  readonly sides: Side[] = ['B', 'W'];

  private sub?: Subscription;

  constructor(
    private router: Router,
    private http: HttpClient,
    private settings: SettingsService,
    private config: GameConfigService,
    private engine: GameEngineService
  ) {}

  ngOnInit(): void {
    this.genCode = this.engine.randomRoomCode();
    this.name = this.settings.value.lastName || '';
    this.sub = this.settings.settings$.subscribe((s) => {
      this.colors = this.settings.colors;
      this.tokens = s.tokens;
      this.starfield = s.starfield;
      this.fieldBg = fieldBackground(this.colors);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ── Mode selection ──────────────────────────────────────────────────────
  choose(mode: LobbyMode): void {
    this.mode = mode;
    this.err = '';
    if (mode === 'create') this.side = 'B';
    if (mode === 'join') this.side = 'W';
  }

  back(): void {
    this.mode = null;
    this.err = '';
  }

  setSide(s: Side): void {
    this.side = s;
  }

  get shadeB(): string {
    return shade(this.colors.B, -0.4);
  }

  get ctaLabel(): string {
    return this.mode === 'join' ? 'Join & play →' : "Let's play! →";
  }

  charBtnStyle(s: Side): Record<string, string> {
    const on = this.side === s;
    return {
      background: hexA(this.colors[s], on ? 0.22 : 0.05),
      border: `2.5px solid ${on ? this.colors[s] : hexA('#fff', 0.12)}`,
      'box-shadow': on ? `0 4px 0 ${shade(this.colors[s], -0.45)}` : `0 3px 0 ${hexA('#000', 0.2)}`,
    };
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }

  /** Label under a character pick button (e.g. "rocket", "astronaut"). */
  sideLabel(s: Side): string {
    const set = TOKEN_SETS[this.tokens];
    if (!set) return s === 'B' ? 'P1' : 'P2';
    return set[s].split('/').pop()!.replace('.png', '');
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  go(): void {
    if (this.busy) return;
    this.err = '';

    if (this.mode === 'join' && this.code.trim().length < 3) {
      this.err = 'Type a room code!';
      return;
    }

    const myName = this.name.trim() || (this.mode === 'join' ? 'Guest' : 'You');
    this.settings.set({ lastName: this.name.trim() });

    if (this.mode === 'local') {
      this.startMatch('local', this.genCode, this.rounds, this.side, myName);
      return;
    }
    if (this.mode === 'create') {
      this.createRoom(myName);
      return;
    }
    if (this.mode === 'join') {
      this.joinRoom(myName);
    }
  }

  private createRoom(myName: string): void {
    this.busy = true;
    const roomId = this.genCode;
    this.http
      .post<any>(
        `${this.settings.apiBase()}/api/game/create?roomId=${roomId}&hostId=${encodeURIComponent(
          myName
        )}&hostColor=${this.side}&maxScore=${this.rounds}`,
        {}
      )
      .subscribe({
        next: () => this.startMatch('online', roomId, this.rounds, this.side, myName),
        error: (e) => {
          this.busy = false;
          this.err = e?.error?.message || 'Could not create the room.';
        },
      });
  }

  private joinRoom(myName: string): void {
    this.busy = true;
    const roomId = this.code.trim().toUpperCase();
    this.http
      .get<any>(
        `${this.settings.apiBase()}/api/game/join?roomId=${roomId}&joinerId=${encodeURIComponent(
          myName
        )}&joinerColor=${this.side}`
      )
      .subscribe({
        next: (game) => {
          let mySide: Side;
          if (game.playerBlack === myName) mySide = 'B';
          else if (game.playerWhite === myName) mySide = 'W';
          else {
            this.busy = false;
            this.err = 'Room is full or you could not join.';
            return;
          }
          this.startMatch('online', roomId, game.maxScore || this.rounds, mySide, myName);
        },
        error: (e) => {
          this.busy = false;
          this.err = e?.error?.message || 'Could not join the room.';
        },
      });
  }

  private async startMatch(
    mode: 'local' | 'online',
    roomCode: string,
    maxScore: number,
    mySide: Side,
    myName: string
  ): Promise<void> {
    await this.config.start({
      mode,
      roomCode,
      maxScore: Math.max(1, Math.min(9, maxScore)),
      mySide,
      myName,
    });
    this.busy = false;
    this.router.navigate(['/game'], { replaceUrl: true });
  }
}
