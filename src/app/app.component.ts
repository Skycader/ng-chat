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
  public socket = io('ws://localhost:3000');
  public message: string = '';
  public messages: message[] = [];
  public online: boolean = false;
  public onlineUsers: number = 0;
  public username: string = '';

  ngOnInit() {
    this.socket.on('connect', () => {
      this.online = true;
    });
    this.socket.on('disconnect', () => {
      this.online = false;
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
  }

  public sendMessage() {
    this.socket.emit('message', this.username, this.message);
    this.message = '';
  }
}
