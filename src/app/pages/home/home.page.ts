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
  players: {black: string, white: string} = {black: 'Black', white: 'White'}
  currentPlayer: 'B' | 'W' = 'B';
  score = { B: 0, W: 0 };
  gameOver = false;
  winner: 'B' | 'W' | null = null;

  // Are we done with the entire match (e.g., someone reached maxScore)?
  matchDone = false;
  finalWinner: 'B' | 'W' | null = null;

  // Fading animation for ring rotation
  isRotating = false;

  // My color
  myColor: 'B' | 'W' | null = null;
  roomId: string = '';
  myUserId: string = '';

  get myTurn(): boolean {
    return (
      !this.gameOver && !this.matchDone && this.currentPlayer === this.myColor
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
        this.handleGameState(game);
      });
  }

  handleGameState(newState: any) {
    console.log(newState);
    // Animate ring rotation if the board changed
    // (Simplest approach: always fade if there's a move.)
    // We'll do a quick fade.
    this.isRotating = true;
    setTimeout(() => {
      this.isRotating = false;
    }, 400);

    this.board = newState.board;
    this.currentPlayer = newState.currentPlayer;
    this.players.black = newState.playerBlack ? newState.playerBlack : 'Black';
    this.players.white = newState.playerWhite ? newState.playerWhite : 'White';
    this.score = {
      B: newState.blackScore,
      W: newState.whiteScore,
    };
    this.gameOver = newState.gameOver;
    this.winner = newState.winner;

    // Check if we reached final match end (someone >= maxScore)
    // The server must store "maxScore" in the Game object to do final check,
    // but let's suppose the server sets "gameOver=true" + "winner=..."
    // if the score hits maxScore. Then we can do:
    if (newState.matchDone) {
      // Suppose the server sets matchDone & finalWinner
      this.matchDone = true;
      this.finalWinner = newState.finalWinner;
    } else {
      // Or we can detect it from the score if needed...
      if (
        newState.maxScore &&
        (this.score.B >= newState.maxScore || this.score.W >= newState.maxScore)
      ) {
        // match is done
        this.matchDone = true;
        this.finalWinner = this.score.B > this.score.W ? 'B' : 'W';
      } else {
        this.matchDone = false;
        this.finalWinner = null;
      }
    }
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
    if ((this.board[r][c] && this.board[r][c] != 'EMPTY') || this.gameOver || this.matchDone) {
      return;
    }

    this.wsService.send('/app/placeMarble', {
      roomId: this.roomId,
      userId: this.myUserId,
      row: r,
      col: c,
    });
  }
}
