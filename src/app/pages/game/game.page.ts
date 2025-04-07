import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebsocketService } from 'src/app/service/websocket.service';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: false,
})
export class GamePage implements OnInit {
  Math = Math;

  boardclientId: string = '';

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
  maxScore: any;
  showPopup: boolean = false;

  get myTurn(): boolean {
    return (
      !this.gameOver &&
      !this.matchDone &&
      this.currentPlayer === this.myColor &&
      !this.inProgress
    );
  }

  constructor(
    private wsService: WebsocketService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.boardclientId = uuidv4();
    // Read route param for room ID
    /* this.route.params.subscribe((params) => {
      this.roomId = params['id'];
    }); */

    // Read user info from localStorage
    this.myUserId = localStorage.getItem('myUserId') || '';
    this.roomId = localStorage.getItem('roomId') || '';
    const color = localStorage.getItem('myColor');
    this.myColor = color === 'W' ? 'W' : 'B';
    if (!this.myUserId || !this.roomId) {
      this.quit();
    }

    // Connect
    this.wsService.connect();

    // Wait for connection
    this.wsService.isConnected().subscribe((connected) => {
      if (connected && this.roomId) {
        // Subscribe to /topic/room/<roomId> for game updates
        this.wsService.subscribe(
          `/topic/room/${this.roomId}`,
          (newState: any) => {
            this.handleGameState(newState, true);
          }
        );

        this.wsService.subscribe(
          `/topic/room/${this.roomId}/placeMarble`,
          (body: any) => {
            if (this.boardclientId !== body.marbleMessage?.boardclientId) {
              this.placeMarbleServer(body);
            }
            this.handleGameState(body, false);
          }
        );
      }
    });

    // Do an initial get to fetch the current game state
    this.http
      .get<any>(`${environment.basePath}/api/game/get?roomId=${this.roomId}`)
      .subscribe((game) => {
        this.handleGameState(game, true);
        this.checkForKana();
      });
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
  }

  handleGameState(newState: any, updateBoard: boolean) {
    if (updateBoard) {
      this.board = newState.board;
    }

    this.currentPlayer = newState.currentPlayer;
    this.maxScore = newState.maxScore;
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
  }

  resetBoard(fullReset: boolean) {
    this.wsService.send('/app/resetGame', {
      roomId: this.roomId,
      fullReset: fullReset,
    });
  }

  placeMarbleServer(bodyResponse: any) {
    this.placeMarble(
      bodyResponse?.marbleMessage?.row,
      bodyResponse?.marbleMessage?.col,
      bodyResponse?.marbleMessage?.userId,
      true
    );
  }

  placeMarble(r: number, c: number, userId: string, serverMove?: boolean) {
    if (!serverMove) {
      if (!this.myTurn) {
        return;
      }
      if (
        (this.board[r][c] && this.board[r][c] != 'EMPTY') ||
        this.gameOver ||
        this.matchDone
      ) {
        return;
      }
    }

    this.inProgress = true;

    this.board[r][c] = this.players.black === userId ? 'B' : 'W';

    setTimeout(() => {
      this.rotateGrid();
      this.inProgress = false;
    }, 400);

    if (!serverMove) {
      setTimeout(() => {
        this.wsService.send('/app/placeMarble', {
          roomId: this.roomId,
          userId: this.myUserId,
          row: r,
          col: c,
          boardclientId: this.boardclientId,
        });
        this.inProgress = false;
      }, 400);
    }
  }

  rotateGrid() {
    const directionMap: any = {
      'rotate-0': { dr: 0, dc: 1 }, // Move right
      'rotate-90': { dr: 1, dc: 0 }, // Move down
      'rotate-180': { dr: 0, dc: -1 }, // Move left
      'rotate--90': { dr: -1, dc: 0 }, // Move up
    };

    const newBoard: string[][] = Array.from(
      { length: 4 },
      () => Array(4).fill('EMPTY') // Initialize a new empty grid
    );

    const cellAnimations: { r: number; c: number; transform: string }[] = [];

    for (let r = 0; r < this.board.length; r++) {
      for (let c = 0; c < this.board[r].length; c++) {
        // Determine the current rotation of the cell
        let rotation = 'rotate-0';
        if (this.arrowDirectionGrid['rotate-90'].includes(`${r}${c}`)) {
          rotation = 'rotate-90';
        } else if (this.arrowDirectionGrid['rotate-180'].includes(`${r}${c}`)) {
          rotation = 'rotate-180';
        } else if (this.arrowDirectionGrid['rotate--90'].includes(`${r}${c}`)) {
          rotation = 'rotate--90';
        }

        // Get the direction of movement
        const { dr, dc } = directionMap[rotation];

        // Calculate the new position (wrap around the grid if necessary)
        const newR = (r + dr + 4) % 4;
        const newC = (c + dc + 4) % 4;

        // Move the content to the new position
        newBoard[newR][newC] = this.board[r][c];

        // Store animation details
        const translateX = (newC - c) * 100; // 100% per cell
        const translateY = (newR - r) * 100; // 100% per cell
        cellAnimations.push({
          r,
          c,
          transform: `translate(${translateX}%, ${translateY}%)`,
        });
      }
    }

    // Trigger animations
    cellAnimations.forEach(({ r, c, transform }) => {
      const cellElement = document.querySelector(
        `.board-cell[data-row="${r}"][data-col="${c}"]`
      ) as HTMLElement;
      if (cellElement) {
        cellElement.style.transform = transform;
      }
    });

    // Update the board state after animations
    setTimeout(() => {
      this.board = newBoard;
      cellAnimations.forEach(({ r, c }) => {
        const cellElement = document.querySelector(
          `.board-cell[data-row="${r}"][data-col="${c}"]`
        ) as HTMLElement;
        if (cellElement) {
          cellElement.style.transform = 'none'; // Reset transform
        }
      });
    }, 100); // Match the animation duration
  }

  quit() {
    this.router.navigate(['/room']);
  }

  //--- kana message
  checkForKana() {
    // Compare ignoring case
    if (this.myUserId.toLowerCase() === 'babe25') {
      this.showPopup = true;
    }
  }

  dismissPopup() {
    this.showPopup = false;
  }

  get flatBoard(): string[] {
    return this.board.reduce((acc, row) => acc.concat(row), []);
  }

  copyRoomId() {
    if (navigator.clipboard && this.roomId) {
      navigator.clipboard.writeText(this.roomId).then(() => {
        console.log('Room ID copied to clipboard!');
      });
    }
  }
}
