import { Injectable } from '@angular/core';
import * as Stomp from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Stomp.Client | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);

  connect() {
    const socket = new SockJS('/orbitways-websocket');
    this.stompClient = new Stomp.Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log('Connected to STOMP');
        this.connected$.next(true);
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });
    this.stompClient.activate();
  }

  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  subscribe(destination: string, callback: (message: any) => void) {
    if (!this.stompClient) return;
    this.stompClient.subscribe(destination, (msg) => {
      callback(JSON.parse(msg.body));
    });
  }

  send(destination: string, body: any) {
    if (!this.stompClient) return;
    this.stompClient.publish({
      destination: destination,
      body: JSON.stringify(body)
    });
  }
}
