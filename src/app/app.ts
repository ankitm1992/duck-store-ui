import { Component } from '@angular/core';
import { DuckList } from './duck/duck-list/duck-list';

@Component({
  selector: 'app-root',
  imports: [DuckList],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}