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
      event.preventDefault(); 
      const target = document.querySelector('#jobs');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
 openWhatsApp() {
  const phoneNumber = '919994111214'; 
  const message = 'Hello, I would like to join in your Company';
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}


}