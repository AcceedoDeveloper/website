import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  HostListener,
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
showControls=false;
hideControlsTimeout:any;
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

@ViewChild('laptopVideo') laptopVideo!: ElementRef<HTMLVideoElement>;
isPaused = false;
 currentTime = 0;
  duration = 0;

toggleVideo() {
  const video = this.laptopVideo?.nativeElement;
  if (!video) return;

  if (video.paused) {
    video.play();
    this.isPaused = false;
  } else {
    video.pause();
    this.isPaused = true;
  }

  this.showControlsTemporarily();
}

onVideoAreaClick() {
  this.toggleVideo();
  this.showControlsTemporarily();
}

 showControlsTemporarily() {
    this.showControls = true;

    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
    }

    this.hideControlsTimeout = setTimeout(() => {
      this.showControls = false;
    }, 3000);
  }


onLoadedMetadata() {
    const video = this.laptopVideo?.nativeElement;
    if (!video) return;

    this.duration = video.duration || 0;
  }

  onTimeUpdate() {
    const video = this.laptopVideo?.nativeElement;
    if (!video) return;

    this.currentTime = video.currentTime || 0;
    this.duration = video.duration || 0;
    this.isPaused = video.paused;
  }

 seekVideo(event: Event) {
  const input = event.target as HTMLInputElement;
  const video = this.laptopVideo?.nativeElement;
  if (!video) return;

  const value = Number(input.value);
  video.currentTime = value;
  this.currentTime = value;

  this.showControlsTemporarily();
}

  formatTime(time: number): string {
    if (!time || isNaN(time)) return '0:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }


  @ViewChild('swipeArea') swipeArea!: ElementRef;

  maxPage = 2;
  private startX = 0;
  private endX = 0;
  private touchStartListener!: () => void;
  private touchEndListener!: () => void;

  /* =====================================
        IMAGE MODAL
  ====================================== */

  modalOpen = false;
modalImage = '';

openImage(img: string): void {
  this.modalImage = img;
  this.modalOpen = true;
}

closeImage(): void {
  this.modalOpen = false;
}


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

    this.setupScrollReveal();

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

    this.touchStartListener = this.renderer.listen(el, 'touchstart', (e: TouchEvent) => {
      this.startX = e.touches[0].clientX;
    });

    this.touchEndListener = this.renderer.listen(el, 'touchend', (e: TouchEvent) => {

      this.endX = e.changedTouches[0].clientX;
      this.handleSwipe();

    });

  }

  handleSwipe(): void {

    const diff = this.startX - this.endX;

    if (diff > 50 && this.currentPage < this.maxPage) {
      this.currentPage++;
    }

    if (diff < -50 && this.currentPage > 0) {
      this.currentPage--;
    }

  }

  ngOnDestroy(): void {

    if (this.touchStartListener) this.touchStartListener();
    if (this.touchEndListener) this.touchEndListener();

    if (this.observer) this.observer.disconnect();

  }

    @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const activeTag = (document.activeElement?.tagName || '').toLowerCase();

    // don't affect typing inside inputs
    if (
      activeTag === 'input' ||
      activeTag === 'textarea' ||
      (document.activeElement as HTMLElement)?.isContentEditable
    ) {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      this.toggleVideo();
    }
  }
}

