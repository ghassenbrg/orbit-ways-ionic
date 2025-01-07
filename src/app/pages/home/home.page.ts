import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from 'src/app/service/websocket.service';

type CellValue = 'B' | 'W' | ''; 

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  board: CellValue[][] = [];
  currentPlayer: CellValue = 'B';
  gameOver = false;
  winner: CellValue | null = null;
  score: any = { B: 0, W: 0 };

  roomId: string = '';
  // NEW:
  myUserId: string = '';
  myColor: CellValue = 'B'; 

  constructor(
    private route: ActivatedRoute,
    private wsService: WebsocketService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Grab roomId
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    // Retrieve my stored user ID + color
    this.myUserId = localStorage.getItem('myUserId') || 'UnknownUser';
    this.myColor = (localStorage.getItem('myColor') as CellValue) || 'B';

    // Initialize WebSocket
    this.wsService.connect();
    // Subscribe to the room’s topic once connected
    this.wsService.isConnected().subscribe((connected) => {
      if (connected) {
        this.wsService.subscribe(`/topic/room/${this.roomId}`, (gameState) => {
          this.updateFromServer(gameState);
        });
      }
    });

    // Do an initial get to fetch the current game state
    this.http
      .get<any>(
        `/api/game/join?roomId=${this.roomId}&joinerId=${this.myUserId}&joinerColor=${this.myColor}`
      )
      .subscribe((game) => {
        this.updateFromServer(game);
      });
  }

  updateFromServer(game: any) {
    this.gameOver = game.gameOver;
    this.winner = game.winner === null ? null : (game.winner as CellValue);
    this.board = game.board.map((row: string[]) =>
      row.map((cell: string) => (cell === 'B' ? 'B' : cell === 'W' ? 'W' : ''))
    );
    this.currentPlayer =
      game.currentPlayer === 'B' ? 'B' : game.currentPlayer === 'W' ? 'W' : '';
    this.score.B = game.blackScore;
    this.score.W = game.whiteScore;
  }

  placeMarble(r: number, c: number) {
    if (this.gameOver) return;
    // Optional client-side check:
    if (this.currentPlayer !== this.myColor) {
      // It's not my turn, do nothing
      return;
    }

    this.wsService.send('/app/placeMarble', {
      roomId: this.roomId,
      userId: this.myUserId, // <--- pass userId
      row: r,
      col: c,
    });
    // The server will broadcast the updated game to everyone
  }

  resetBoard(clearScore: boolean) {
    this.http
      .post<any>(
        `/api/game/reset?roomId=${this.roomId}&clearScore=${clearScore}`,
        {}
      )
      .subscribe((game) => {
        this.updateFromServer(game);
      });
  }
}
