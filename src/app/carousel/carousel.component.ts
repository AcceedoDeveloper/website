import { Component } from '@angular/core';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})

export class CarouselComponent {
  customOptions: any = {
    stagePadding: 100,
    loop: true,
    margin: 25,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: true,
    // autoplay: true,
    // autoplayTimeout: 5000,
    // autoplayHoverPause: true,
    // autoplaySpeed: 700,
    // autoplayHoverSpeed: 700,
    
    navSpeed: 700,
    navText: ['', ''],
    center: true,
    responsive: {
      0: {
        items: 1.1 
      },
      576: {
        items: 1.1
      },
      768: {
        items: 1.1
      },
      992: {
        items: 1.1
      },
      1200: {
        items: 1.1
      }
    },
    nav: true
  }
}
