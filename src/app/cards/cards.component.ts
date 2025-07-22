import { Component, OnInit, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})


export class CardsComponent implements OnInit {

  constructor(private router: Router) {}


  
    
  products = [
    {
      title: ' Attendance System',
      image: '/assets/a 3.jpg',
      points: [
        'Streamlines employee tracking, attendance, and payroll processes with cloud-based flexibility.',
        'Simplifies onboarding, salary components, and attendance data management.',
        'Enhances productivity and accuracy in workforce management'
      ],
      link: '/product2'
      
    },
    {
      title: 'Melting Software',
      image: '/assets/melt 3 (2).jpg',
      points: [
        'Optimizes production with automated material, alloy, and temperature management.',
        'Features spectrum analysis, auto reports, stock updates, and furnace tracking.',
        'Boosts efficiency and ensures high-quality production.'
      ],
      link: '/melting-software'
    },
    {
      title: 'Heat Treatment',
      image: '/assets/melt 7.jpg',
      points: [
        'Real-time monitoring of temperature and cycle data with cloud storage.',
        'Simplifies cycle management, batch tracking, and customized reporting.',
        'Enhances efficiency and accuracy in heat treatment operations.'
      ],
      link:   '/product1'
    },
    {
      title: 'Power Metrics',
      image: '/assets/_a49041bd-3702-4617-b53d-12fd1f1fc0af.jpg',
      points: [
        'Monitors power metrics for efficient energy use and waste reduction.',
        'Integrates with IoT for live monitoring, remote control, and predictions.',
        'Delivers AI-driven reports to optimize operations and cut costs.'
      ],
      link: '/power-metrics'
    },
    {
      title: 'Production Monitor',
      image: '/assets/PD.jpg',
      points: [
        'Real-time visibility with advanced analytics and AI-powered insights.',
        'Collect real-time data without disrupting operations.'
      ],
      link: '/product-monitor'
    }
  ];

  activeIndex = 0;
  slidesToShow = 4;
  visibleSlides: any[] = [];

  ngOnInit() {
    this.updateSlidesToShow();
    this.updateVisibleSlides();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateSlidesToShow();
  }

  updateSlidesToShow() {
    const width = window.innerWidth;
    if (width < 768) {
      this.slidesToShow = 1;
    } else if (width < 992) {
      this.slidesToShow = 2;
    } else if (width < 1200) {
      this.slidesToShow = 3;
    } else {
      this.slidesToShow = 4;
    }
    this.updateVisibleSlides();
  }

  nextSlide() {
    this.activeIndex = (this.activeIndex + 1) % this.products.length;
    this.updateVisibleSlides();
  }

  prevSlide() {
    this.activeIndex = (this.activeIndex - 1 + this.products.length) % this.products.length;
    this.updateVisibleSlides();
  }

  updateVisibleSlides() {
    this.visibleSlides = [];
    for (let i = 0; i < this.slidesToShow; i++) {
      const index = (this.activeIndex + i) % this.products.length;
      this.visibleSlides.push(this.products[index]);
    }
  }


  goToProduct(link: string) {
  this.router.navigate([link]);
}
  
}

