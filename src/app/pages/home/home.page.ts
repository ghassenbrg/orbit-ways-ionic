import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebsocketService } from 'src/app/service/websocket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  board: string[][] = [];
  players: { black: string; white: string } = {
    black: 'Black',
    white: 'White',
  };
  currentPlayer: 'B' | 'W' = 'B';
  score = { B: 0, W: 0 };
  gameOver = false;
  winner: 'B' | 'W' | null = null;

  arrowDirectionGrid: any = {
    'rotate-180': ['01', '02', '03', '12'],
    'rotate-90': ['00', '10', '20', '11'],
    'rotate--90': ['33', '23', '13', '22'],
    'rotate-0': ['30', '31', '32', '21'],
  };

  fadeStates: boolean[][] = [];

  // Are we done with the entire match (e.g., someone reached maxScore)?
  matchDone = false;
  inProgress = false;
  finalWinner: 'B' | 'W' | null = null;

  // Fading animation for ring rotation
  isRotating = false;

  // My color
  myColor: 'B' | 'W' | null = null;
  roomId: string = '';
  myUserId: string = '';

  get myTurn(): boolean {
    return (
      !this.gameOver && !this.matchDone && this.currentPlayer === this.myColor && !this.inProgress
    );
  }

  constructor(
    private wsService: WebsocketService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Read route param for room ID
    this.route.params.subscribe((params) => {
      this.roomId = params['id'];
    });

    // Read user info from localStorage
    this.myUserId = localStorage.getItem('myUserId') || '';
    const color = localStorage.getItem('myColor');
    this.myColor = color === 'W' ? 'W' : 'B';

    // Connect
    this.wsService.connect();

    // Wait for connection
    this.wsService.isConnected().subscribe((connected) => {
      if (connected && this.roomId) {
        // Subscribe to /topic/room/<roomId> for game updates
        this.wsService.subscribe(
          `/topic/room/${this.roomId}`,
          (newState: any) => {
            this.handleGameState(newState);
          }
        );
      }
    });

    // Do an initial get to fetch the current game state
    this.http
      .get<any>(
        `/api/game/get?roomId=${this.roomId}&joinerId=${this.myUserId}&joinerColor=${this.myColor}`
      )
      .subscribe((game) => {
        this.initializeFadeStates();
        this.handleGameState(game);
      });
  }

  initializeFadeStates() {
    this.fadeStates = []; // Initialize the array

    for (let r = 0; r < 4; r++) {
      this.fadeStates[r] = []; // Initialize each row as an array
      for (let c = 0; c < 4; c++) {
        this.fadeStates[r][c] = false; // Set default value
      }
    }
  }

  handleGameState(newState: any) {
    // Trigger fade-out
    this.board.forEach((row, r) => {
      row.forEach((cell, c) => {
        this.fadeStates[r][c] = true; // Apply fade-out
      });
    });

    // Delay before updating board and triggering fade-in
    setTimeout(() => {
      this.board = newState.board;

      // Trigger fade-in with staggered delays
      this.board.forEach((row, r) => {
        row.forEach((cell, c) => {
          setTimeout(() => {
            this.fadeStates[r][c] = false; // Remove fade-out
          }, r * 100 + c * 50); // Stagger animations by row and column
        });
      });

      this.currentPlayer = newState.currentPlayer;
      this.players.black = newState.playerBlack || 'Black';
      this.players.white = newState.playerWhite || 'White';
      this.score = { B: newState.blackScore, W: newState.whiteScore };
      this.gameOver = newState.gameOver;
      this.winner = newState.winner;

      if (newState.matchDone) {
        this.matchDone = true;
        this.finalWinner = newState.finalWinner;
      } else {
        this.matchDone = false;
        this.finalWinner = null;
      }
    }, 0); // Duration of fade-out
  }

  resetBoard(fullReset: boolean) {
    this.wsService.send('/app/resetGame', {
      roomId: this.roomId,
      fullReset: fullReset,
    });
  }

  placeMarble(r: number, c: number) {
    if (!this.myTurn) {
      console.log('Not your turn!');
      return;
    }
    if (
      (this.board[r][c] && this.board[r][c] != 'EMPTY') ||
      this.gameOver ||
      this.matchDone
    ) {
      return;
    }

    this.inProgress = true;

    this.board[r][c] = this.currentPlayer;

    setTimeout(() => {
      this.wsService.send('/app/placeMarble', {
        roomId: this.roomId,
        userId: this.myUserId,
        row: r,
        col: c,
      });
      this.inProgress = false;
    }, 100);
  }
}
