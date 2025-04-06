import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-room',
  templateUrl: './room.page.html',
  styleUrls: ['./room.page.scss'],
  standalone: false,
})
export class RoomPage implements OnInit {
  showCreateRoom = true;

  roomId: string = '';
  userId: string = '';
  maxScore: number = 3; // new field
  chosenColor: string = 'B'; // default
  errorMessage: string = '';
  roomIdGenerated: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.generateRoomID();
  }

  createRoom() {
    this.errorMessage = '';
    if (!this.roomId || !this.userId) {
      this.errorMessage = 'Please fill in Room ID and User ID.';
      return;
    }

    // We pass hostId, hostColor, and maxScore to the backend
    this.http
      .post<any>(
        `${environment.basePath}/api/game/create?roomId=${this.roomId}&hostId=${this.userId}&hostColor=${this.chosenColor}&maxScore=${this.maxScore}`,
        {}
      )
      .subscribe({
        next: (game) => {
          console.log('Room created', game);
          // Store my info in localStorage
          localStorage.setItem('myUserId', this.userId);
          localStorage.setItem('myColor', this.chosenColor);
          localStorage.setItem('roomId', this.roomId);
          // Navigate to game page
          this.goToGame();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error creating room.';
        },
      });
  }

  joinRoom() {
    this.errorMessage = '';
    if (!this.roomId || !this.userId) {
      this.errorMessage = 'Please fill in Room ID and User ID.';
      return;
    }

    // We pass joinerId and joinerColor
    this.http
      .get<any>(
        `${environment.basePath}/api/game/join?roomId=${this.roomId}&joinerId=${this.userId}&joinerColor=${this.chosenColor}`
      )
      .subscribe({
        next: (game) => {
          console.log('Joined room', game);
          // Did the server auto-assign me a different color if chosen was taken?
          // Let's figure out if I'm black or white from the response:
          if (game.playerBlack === this.userId) {
            localStorage.setItem('myColor', 'B');
          } else if (game.playerWhite === this.userId) {
            localStorage.setItem('myColor', 'W');
          } else {
            // Not assigned => error or room full
            this.errorMessage = 'Room is full or you could not join.';
            return;
          }

          localStorage.setItem('myUserId', this.userId);
          localStorage.setItem('roomId', this.roomId);
          this.goToGame();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error joining room.';
        },
      });
  }

  goToGame() {
    this.router.navigate(['/game', this.roomId], { replaceUrl: true });
  }

  chosenAction: 'CREATE' | 'JOIN' | null = null;

  chooseAction(action: 'CREATE' | 'JOIN' | null) {
    this.chosenAction = action;
    if (!this.roomId || this.roomId === this.roomIdGenerated)
      this.roomId = action === 'CREATE' ? this.roomIdGenerated : '';
  }

  generateRoomID() {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomIdGenerated = '';

    // Generate a 5-character room ID
    for (let i = 0; i < 5; i++) {
      roomIdGenerated += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if the room ID is new
    this.http
      .get<any>(
        `${environment.basePath}/api/game/get?roomId=${roomIdGenerated}`
      )
      .subscribe(
        (game) => {
          // If the room exists, recursively call the function to generate a new one
          this.generateRoomID();
        },
        (err) => {
          // If an error occurs (room ID does not exist), set the new room ID
          this.roomIdGenerated = roomIdGenerated;
          this.roomId = this.roomIdGenerated;
        }
      );
  }

  submit() {
    if (this.chosenAction == 'CREATE') {
      this.createRoom();
    } else {
      this.joinRoom();
    }
  }
}
