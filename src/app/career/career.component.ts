import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-career',
  templateUrl: './career.component.html',
  styleUrl: './career.component.css'
})
export class CareerComponent implements AfterViewInit {
  ngAfterViewInit() {
    const scrollButton = document.querySelector('.btn');
    scrollButton?.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent default anchor behavior
      const target = document.querySelector('#jobs');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}