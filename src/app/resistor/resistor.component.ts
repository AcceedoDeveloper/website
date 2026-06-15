import { Component } from '@angular/core';

@Component({
  selector: 'app-resistor',
  templateUrl: './resistor.component.html',
  styleUrl: './resistor.component.css'
})
export class ResistorComponent {

  todayDate: string = '';

  ngOnInit() {
    this.updateDate();
  }

  updateDate() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    this.todayDate = now.toLocaleDateString('en-GB', options);
  }

}
