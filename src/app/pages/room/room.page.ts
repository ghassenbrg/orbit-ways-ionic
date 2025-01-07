import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-room',
  templateUrl: './room.page.html',
  styleUrls: ['./room.page.scss'],
  standalone: false
})
export class RoomPage {
  roomId: string = '';
  userId: string = '';
  chosenColor: string = 'B'; // default

  constructor(private router: Router, private http: HttpClient) {}

  createRoom() {
    if (!this.roomId || !this.userId) return;

    // We pass both hostId and hostColor to the backend
    this.http
      .post<any>(
        `/api/game/create?roomId=${this.roomId}&hostId=${this.userId}&hostColor=${this.chosenColor}`,
        {}
      )
      .subscribe((game) => {
        console.log('Room created', game);
        // Store my info in localStorage or pass via route
        localStorage.setItem('myUserId', this.userId);
        localStorage.setItem('myColor', this.chosenColor);

        this.goToGame();
      });
  }

  joinRoom() {
    if (!this.roomId || !this.userId) return;

    // We pass both joinerId and joinerColor
    this.http
      .get<any>(
        `/api/game/join?roomId=${this.roomId}&joinerId=${this.userId}&joinerColor=${this.chosenColor}`
      )
      .subscribe((game) => {
        console.log('Joined room', game);
        localStorage.setItem('myUserId', this.userId);
        localStorage.setItem('myColor', this.chosenColor);

        this.goToGame();
      });
  }

  goToGame() {
    this.router.navigate(['/home', this.roomId]);
  }
}
