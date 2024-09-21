import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { io } from 'socket.io-client';

interface message {
  username: string;
  message: string;
  date: Date;
}
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'ng-chat';
  public socket = io('wss://backend-chat.vodri.com');
  public message: string = '';
  public messages: message[] = [];
  public online: boolean = false;
  public onlineUsers: number = 0;
  public username: string = '';
  public roomId: string = '';
  public currentRoomId: string = '';

  ngOnInit() {
    this.socket.on('connect', () => {
      this.online = true;
    });
    this.socket.on('disconnect', () => {
      this.online = false;
      this.currentRoomId = '';
    });

    this.socket.on('current-online', (online) => {
      this.onlineUsers = online;
    });

    this.socket.on('message', (username, message, date) => {
      this.messages.unshift({ username, message, date });
      this.messages.splice(200);
    });

    this.socket.on('last100', (last100) => {
      this.messages.unshift(...last100);
    });

    this.socket.on('private-msg', (username, message, date) => {
      this.messages.unshift({ username, message, date });
    });

    this.socket.on('room-join', (roomId) => {
      this.currentRoomId = roomId;
    });

    this.socket.on('leave-all-rooms', () => {
      this.currentRoomId = '';
    });
  }

  public sendMessage(room = '') {
    this.socket.emit('message', this.username, this.message, this.roomId);
    this.message = '';
  }

  public sendPrivateMessage() {
    this.socket.emit('private-msg', 'adresat', this.username, this.message);
    this.message = '';
  }

  public joinRoom() {
    this.socket.emit('join-room', this.roomId);

    /**
     * Перестаем слушать общий чат
     */
    this.socket.off('message');

    this.socket.on('room-message', (username, message, date) => {
      this.messages.unshift({ username, message, date });
      this.messages.splice(200);
    });
  }

  public leaveRoom() {
    this.socket.emit('leave-all-rooms');

    /**
     * Снова начинаем слушать общий чат
     */
    this.socket.on('message', (username, message, date) => {
      this.messages.unshift({ username, message, date });
      this.messages.splice(200);
    });
  }
}
