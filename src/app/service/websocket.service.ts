import { Injectable } from '@angular/core';
import * as Stomp from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { StompSubscription } from '@stomp/stompjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Stomp.Client | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private subscriptions: { [key: string]: StompSubscription | null } = {};

  constructor() {}

  connect() {
    const socket = new SockJS(`${environment.basePath}/orbitways-websocket`);
    this.stompClient = new Stomp.Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log('Connected to STOMP');
        this.connected$.next(true);
      },
      onStompError: (frame) => {
        console.error('Broker error: ' + frame.headers['message']);
        console.error('Details: ' + frame.body);
      }
    });
    this.stompClient.activate();
  }

  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  subscribe(destination: string, callback: (message: any) => void): void {
    if (!this.stompClient) return;
    if (!this.stompClient.active) return;

    this.subscriptions[destination] = this.stompClient.subscribe(destination, (msg) => {
      callback(JSON.parse(msg.body));
    });
  }

  send(destination: string, body: any) {
    if (!this.stompClient) return;
    if (!this.stompClient.active) {
      console.warn('STOMP client not active, cannot send message.');
      return;
    }
    this.stompClient.publish({
      destination,
      body: JSON.stringify(body)
    });
  }

  unsubscribe(destination: string): void {
    if (this.subscriptions[destination]) {
      this.subscriptions[destination]?.unsubscribe();
      this.subscriptions[destination] = null;
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.connected$.next(false);
  }
}
