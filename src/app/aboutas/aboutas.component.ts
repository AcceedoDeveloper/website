import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-aboutas',
  templateUrl: './aboutas.component.html',
  styleUrl: './aboutas.component.css'
})
export class AboutasComponent  implements OnInit {
  constructor() { }

  ngOnInit(): void {
    this.initAnimations();
  }

  initAnimations(): void {
    const sections = document.querySelectorAll('.section');
    const featureIcons = document.querySelectorAll('.feature-icon');
   
    // Intersection Observer for section animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
   
    sections.forEach(section => {
      observer.observe(section);
    });

    // Hover effects for feature icons
    featureIcons.forEach(icon => {
      icon.addEventListener('mouseenter', () => {
        icon.classList.add('pulse');
      });
      icon.addEventListener('mouseleave', () => {
        icon.classList.remove('pulse');
      });
    });
  }

  // Optional: Handle window scroll events if needed
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event) {
    // You can add scroll-based logic here if needed
  }
}
