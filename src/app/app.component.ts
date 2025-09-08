import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'report';

  constructor(private location: Location) {}

  // This function allows browser-like back navigation
  goBack(): void {
    this.location.back();
  }
}



