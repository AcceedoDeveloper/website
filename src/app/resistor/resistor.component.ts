import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-resistor',
  templateUrl: './resistor.component.html',
  styleUrl: './resistor.component.css'
})
export class ResistorComponent {

  selectedTopic: string = 'resistor';

  @ViewChild('animationCard') animationCard!: ElementRef<HTMLElement>;
  @ViewChild('contentArea') contentArea!: ElementRef<HTMLElement>;

  changeTopic(topic: string): void {
    this.selectedTopic = topic;

    // Wait for *ngIf to render the new content, then scroll both
    // panels back to their own top (not the whole window).
    setTimeout(() => {
      this.animationCard?.nativeElement.scrollIntoView({
        behavior: 'auto',
        block: 'start'
      });
      this.contentArea?.nativeElement.scrollIntoView({
        behavior: 'auto',
        block: 'start'
      });
    });
  }

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