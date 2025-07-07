import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent {
  @ViewChild('carousel', { static: false }) carousel!: ElementRef;

  scrollRight() {
    const container = this.carousel.nativeElement;
    const cardWidth = container.querySelector('.carousel-card')?.offsetWidth || 300;
    const gap = 20;

    if (container.scrollLeft + container.offsetWidth >= container.scrollWidth - 5) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
    }
  }

  scrollLeft() {
    const container = this.carousel.nativeElement;
    const cardWidth = container.querySelector('.carousel-card')?.offsetWidth || 300;
    const gap = 20;

    if (container.scrollLeft <= 5) {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    }
  }
}
