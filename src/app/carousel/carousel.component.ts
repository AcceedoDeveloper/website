import { Component, HostListener } from '@angular/core';
import {CardsComponent} from '../cards/cards.component';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent {
  slides = [
    {
      image: '/assets/freepik__candid-image-photography-natural-textures-highly-r__28920.jpeg',
      title: 'COMPREHENSIVE SOLUTIONS',
      description: 'An all-in-one platform for planning, scheduling, machine monitoring, rejection control, operator tracking, downtime analysis, and detailed reporting.',
      buttonText: 'Comprehensive Solutions',
      contentClass: ''
    },
{
  image: '/assets/image.jpg.jpg',
  title: 'EMBEDDED INNOVATION',
  description: 'Pioneering the future of technology with high-quality PCB board development and efficient embedded programming solutions.',
  buttonText: 'Embedded Innovation',
  contentClass: 'Embedded'
},
    {
      image: '/assets/freepik__candid-image-photography-natural-textures-highly-r__22273.jpeg',
      title: 'INDUSTRY IoT SOLUTIONS',
      description: 'Transform your manufacturing process with our Industry IoT solution, enabling real-time data analytics and seamless connectivity for unparalleled efficiency.',
      buttonText: 'Industry Iot Solution',
      contentClass: ''
    },
    {
      image: '/assets/modern-equipped-computer-lab.jpg',
      title: 'R&D INNOVATION',
      description: 'Advancing technology through dedicated research, development. Our team focuses on pioneering innovative solutions for embedded systems and web applications.',
      buttonText: 'R&D Innovation',
      contentClass: 'Ino'
    }
  ];

  currentSlide = 0;
  private touchStartX = 0;
  private touchEndX = 0;

  getPrevIndex(): number {
    return this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
  }

  getNextIndex(): number {
    return this.currentSlide === this.slides.length - 1 ? 0 : this.currentSlide + 1;
  }

  onSlideClick(event: MouseEvent, index: number): void {
    if ((event.target as HTMLElement).closest('.slide-content, .custom-button')) {
      return;
    }
    this.goToSlide(index);
  }

  goToSlide(index: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.currentSlide = index;
  }

  prevSlide(event?: Event): void {
    if (event) event.stopPropagation();
    this.currentSlide = this.getPrevIndex();
  }

  nextSlide(event?: Event): void {
    if (event) event.stopPropagation();
    this.currentSlide = this.getNextIndex();
  }

  touchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  touchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].clientX;
    this.handleSwipe();
  }

  handleSwipe(): void {
    const diff = this.touchStartX - this.touchEndX;
    const swipeThreshold = 50;

    if (diff > swipeThreshold) {
      this.nextSlide();
    } else if (diff < -swipeThreshold) {
      this.prevSlide();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.prevSlide();
    } else if (event.key === 'ArrowRight') {
      this.nextSlide();
    }
  }
}