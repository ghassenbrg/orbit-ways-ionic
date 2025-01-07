import { Component, OnInit } from '@angular/core';

type CellValue = 'B' | 'W' | ''; // B for Black, W for White, '' empty

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  board: CellValue[][] = [];
  currentPlayer: CellValue = 'B';
  gameOver = false;
  winner: CellValue | null = null;
  score: any = {
    B: 0,
    W: 0,
  };

  // ADD THIS:
  isAnimating = false; // to block clicks & toggle CSS class

  constructor() {}

  ngOnInit() {
    this.resetBoard(true);
  }

  resetBoard(clearScore: boolean) {
    this.gameOver = false;
    this.winner = null;
    this.board = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => '')
    );
    this.currentPlayer = 'B';
    if (clearScore) {
      this.score = {
        B: 0,
        W: 0,
      };
    }
  }

  placeMarble(r: number, c: number) {
    // Block click if rotating
    if (this.isAnimating || this.gameOver) return;

    if (!this.board[r][c]) {
      this.board[r][c] = this.currentPlayer;
      this.rotateRing(); // Trigger rotation after placing a marble
      this.switchCurrentPlayer();
    }
  }

  switchCurrentPlayer() {
    this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
  }

  rotateRing() {
    // Prevent repeated rotations while animating
    if (this.isAnimating || this.gameOver) return;

    // 1) Start the "visual" board rotation for 0.5s
    this.isAnimating = true;

    setTimeout(() => {
      // 2) After 0.5s, do the REAL array rotation
      this.rotateOuterRing();
      this.rotateInnerRing();
      this.checkWinner();

      // 3) Re-enable clicks
      this.isAnimating = false;
    }, 500);
  }

  checkWinner() {
    // 1) Check each row
    for (let row = 0; row < 4; row++) {
      // If the first cell isn't empty AND all 4 cells match
      if (
        this.board[row][0] &&
        this.board[row][0] === this.board[row][1] &&
        this.board[row][1] === this.board[row][2] &&
        this.board[row][2] === this.board[row][3]
      ) {
        this.winner = this.board[row][0]; // 'B' or 'W'
        this.score[this.winner]++;
        this.gameOver = true;
        return;
      }
    }

    // 2) Check each column
    for (let col = 0; col < 4; col++) {
      if (
        this.board[0][col] &&
        this.board[0][col] === this.board[1][col] &&
        this.board[1][col] === this.board[2][col] &&
        this.board[2][col] === this.board[3][col]
      ) {
        this.winner = this.board[0][col];
        this.score[this.winner]++;
        this.gameOver = true;
        return;
      }
    }

    // 3) Check main diagonal (top-left to bottom-right)
    if (
      this.board[0][0] &&
      this.board[0][0] === this.board[1][1] &&
      this.board[1][1] === this.board[2][2] &&
      this.board[2][2] === this.board[3][3]
    ) {
      this.winner = this.board[0][0];
      this.score[this.winner]++;
      this.gameOver = true;
      return;
    }

    // 4) Check anti-diagonal (top-right to bottom-left)
    if (
      this.board[0][3] &&
      this.board[0][3] === this.board[1][2] &&
      this.board[1][2] === this.board[2][1] &&
      this.board[2][1] === this.board[3][0]
    ) {
      this.winner = this.board[0][3];
      this.score[this.winner]++;
      this.gameOver = true;
      return;
    }

    // 5) If no winner so far, check for empty spaces.
    //    If none are empty, it's a tie.
    let isBoardFull = true;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!this.board[r][c]) {
          // if it's '', there's an empty cell
          isBoardFull = false;
          break;
        }
      }
      if (!isBoardFull) break;
    }

    if (isBoardFull) {
      // It's a tie
      this.winner = null; // or 'TIE' if you prefer
      this.gameOver = true;
    }
  }

  rotateOuterRing() {
    const positions = [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [3, 2],
      [3, 1],
      [3, 0],
      [2, 0],
      [1, 0],
    ];

    const [firstRow, firstCol] = positions[0];
    const aux = this.board[firstRow][firstCol];

    for (let i = 0; i < positions.length - 1; i++) {
      const [curR, curC] = positions[i];
      const [nextR, nextC] = positions[i + 1];
      this.board[curR][curC] = this.board[nextR][nextC];
    }

    const [lastRow, lastCol] = positions[positions.length - 1];
    this.board[lastRow][lastCol] = aux;
  }

  rotateInnerRing() {
    const positions = [
      [1, 1],
      [1, 2],
      [2, 2],
      [2, 1],
    ];

    const [firstRow, firstCol] = positions[0];
    const aux = this.board[firstRow][firstCol];

    for (let i = 0; i < positions.length - 1; i++) {
      const [curR, curC] = positions[i];
      const [nextR, nextC] = positions[i + 1];
      this.board[curR][curC] = this.board[nextR][nextC];
    }

    const [lastRow, lastCol] = positions[positions.length - 1];
    this.board[lastRow][lastCol] = aux;
  }
}
