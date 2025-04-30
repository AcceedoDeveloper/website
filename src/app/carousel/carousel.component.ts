import { Component } from '@angular/core';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})

export class CarouselComponent {
  customOptions: any = {
    stagePadding: 50,
    loop: true,
    margin: 20,
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
    responsive: {
      0: {
        items: 1.01
      },
      576: {
        items: 1.01
      },
      768: {
        items: 1.01
      },
      992: {
        items: 1.01
      },
      1200: {
        items: 1.01,
        stagePadding: 82,
        margin: 20
      }
    },
    nav: true
  }
}
