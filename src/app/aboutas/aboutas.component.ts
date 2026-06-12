import { Component, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-aboutas',
  templateUrl: './aboutas.component.html',
  styleUrl: './aboutas.component.css'
})
export class AboutasComponent implements OnInit, OnDestroy, AfterViewInit {
  images: string[] = [
    'assets/company21.jpeg',
    'assets/Company2.jpeg',
    'assets/company3.jpeg',
    'assets/company4.jpeg',
    'assets/company5.jpeg',
    'assets/company8.jpeg',
    'assets/company9.jpeg',
    'assets/company12.jpeg',
    'assets/company15.jpeg',
    'assets/company16.jpeg',
  ];

  currentIndex: number = 0;
  private imageInterval: any;
  mouseX: number = 0;
  mouseY: number = 0;
  private animationFrameId!: number;

  constructor() { }

  ngOnInit(): void {
    this.initAnimations();
    this.startImageSlider(); 
  }

  ngAfterViewInit(): void {
    this.initParticles();
  }

  ngOnDestroy(): void {
    if (this.imageInterval) {
      clearInterval(this.imageInterval);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // --- NEW: Track mouse movement for the "Antigravity" effect ---
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  // Existing HostListener
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event) {
  }

  startImageSlider(): void {
    this.imageInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }, 3500);
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

  // --- NEW: The Particle Network Engine ---
initParticles(): void {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let particlesArray: any[] = [];
    
    // 1. INCREASE DOT COUNT (More dense)
    const numberOfParticles = 180; 

    // Particle Object
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        // 2. INCREASE DOT SIZE (Bolder)
        this.size = Math.random() * 2.5 + 2; 
        this.speedX = (Math.random() * 1) - 0.5; 
        this.speedY = (Math.random() * 1) - 0.5; 
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
      }

      draw() {
        if(!ctx) return;
        // 3. INCREASE OPACITY (Darker purple dots)
        ctx.fillStyle = 'rgba(123, 95, 255, 0.85)'; 
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Load dots
    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }

    // The Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
        
        // Connect dots to each other
        for (let j = i; j < particlesArray.length; j++) {
          const dx = particlesArray[i].x - particlesArray[j].x;
          const dy = particlesArray[i].y - particlesArray[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 4. STRONGER BACKGROUND WEB
          if (distance < 130) { 
            ctx.beginPath();
            ctx.strokeStyle = `rgba(123, 95, 255, ${0.35 - distance/400})`; 
            ctx.lineWidth = 1; // Thicker lines
            ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
            ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
            ctx.stroke();
          }
        }

        // Connect dots to the Mouse
        let relativeMouseY = this.mouseY - canvas.getBoundingClientRect().top;
        
        const dxMouse = particlesArray[i].x - this.mouseX;
        const dyMouse = particlesArray[i].y - relativeMouseY;
        const mouseDistance = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        // 5. STRONGER MAGNETIC MOUSE PULL
        if (mouseDistance < 200) { // Grabs dots from further away
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 95, 162, ${0.8 - mouseDistance/250})`; 
          ctx.lineWidth = 2; // Very bold interaction lines
          ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
          ctx.lineTo(this.mouseX, relativeMouseY);
          ctx.stroke();
        }
      }
      
      // Save the frame ID so we can cancel it in ngOnDestroy
      this.animationFrameId = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
  }
}