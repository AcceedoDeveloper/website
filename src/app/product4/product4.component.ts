import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Renderer2,
  NgZone
} from '@angular/core';

@Component({
  selector: 'app-product4',
  templateUrl: './product4.component.html',
  styleUrls: ['./product4.component.css']
})
export class Product4Component implements OnInit, OnDestroy, AfterViewInit {

  /* =====================================
        DASHBOARD STATS
  ====================================== */
  totalTasks = 0;
  completedTasks = 0;
  activeUsers = 0;
  productivity = 0;

  /* =====================================
        MOBILE SIDE MENU
  ====================================== */
  menuOpen = false;

    currentPage = 0;
  showDemo = false;

  openDemo() {
    this.showDemo = true;
  }

  closeDemo() {
    this.showDemo = false;
  }

  goToPage(index: number) {
    this.currentPage = index;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  /* =====================================
        SWIPE PAGE NAVIGATION
  ====================================== */
  @ViewChild('swipeArea') swipeArea!: ElementRef;

  maxPage = 2; // Update if number of pages changes
  private startX = 0;
  private endX = 0;
  private touchStartListener!: () => void;
  private touchEndListener!: () => void;

 

  /* =====================================
        DARK MODE
  ====================================== */
  isDark = false;

  toggleTheme(): void {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-mode', this.isDark);
  }

  /* =====================================
        COUNTER ANIMATION
  ====================================== */
  constructor(private renderer: Renderer2, private zone: NgZone) {}

  startCounter(target: number, setter: (v: number) => void): void {
    let count = 0;
    const speed = target / 60;

    this.zone.runOutsideAngular(() => {
      const interval = setInterval(() => {
        count += speed;
        if (count >= target) {
          this.zone.run(() => setter(target));
          clearInterval(interval);
        } else {
          this.zone.run(() => setter(Math.floor(count)));
        }
      }, 20);
    });
  }

  /* =====================================
        SCROLL REVEAL
  ====================================== */
  private observer!: IntersectionObserver;

  setupScrollReveal(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => {
      this.observer.observe(el as Element);
    });
  }

  /* =====================================
        LOGIN DEMO MODAL
  ====================================== */
  showLogin = false;

  openLogin(): void {
    this.showLogin = true;
  }

  closeLogin(): void {
    this.showLogin = false;
  }

  fakeLogin(): void {
    alert('Demo Login Successful ✅');
    this.showLogin = false;
  }

  /* =====================================
        LIFECYCLE HOOKS
  ====================================== */
  ngOnInit(): void {
    /* Setup scroll reveal */
    this.setupScrollReveal();

    /* Start animated counters */
    setTimeout(() => {
      this.startCounter(245, v => this.totalTasks = v);
      this.startCounter(180, v => this.completedTasks = v);
      this.startCounter(32, v => this.activeUsers = v);
      this.startCounter(92, v => this.productivity = v);
    }, 500);
  }

  ngAfterViewInit(): void {
    if (!this.swipeArea) return;
    const el = this.swipeArea.nativeElement;

    /* Touch Start */
    this.touchStartListener = this.renderer.listen(el, 'touchstart', (e: TouchEvent) => {
      this.startX = e.touches[0].clientX;
    });

    /* Touch End */
    this.touchEndListener = this.renderer.listen(el, 'touchend', (e: TouchEvent) => {
      this.endX = e.changedTouches[0].clientX;
      this.handleSwipe();
    });
  }

  handleSwipe(): void {
    const diff = this.startX - this.endX;

    /* swipe left */
    if (diff > 50 && this.currentPage < this.maxPage) {
      this.currentPage++;
    }

    /* swipe right */
    if (diff < -50 && this.currentPage > 0) {
      this.currentPage--;
    }
  }

  ngOnDestroy(): void {
    /* Remove event listeners */
    if (this.touchStartListener) this.touchStartListener();
    if (this.touchEndListener) this.touchEndListener();

    /* Disconnect IntersectionObserver */
    if (this.observer) this.observer.disconnect();
  }
}