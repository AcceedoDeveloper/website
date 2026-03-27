import { Component, AfterViewInit,OnInit} from '@angular/core';

@Component({
  selector: 'app-uwb',
  templateUrl: './uwb.component.html',
  styleUrls: ['./uwb.component.css']
})
export class UwbComponent implements AfterViewInit ,OnInit {
  displayA1Distance: number = 4.82;
displayA2Distance: number = 6.14;
baseDistance: number = 10.00;

displayX: number = 4.20;
displayY: number = 5.36;

     nodeCode: string = `export function getTagLocation(company: any, mqttData: any) {
  const a = Number(company?.specification?.[0]?.AnchorDistance);

  if (mqttData?.["X-Axis"] !== undefined) {
    b = Number(mqttData["X-Axis"]);
    bUpdated = true;
  }

  if (mqttData?.["Y-Axis"] !== undefined) {
    c = Number(mqttData["Y-Axis"]);
    cUpdated = true;
  }

  if (!bUpdated || !cUpdated) return null;
  if (b === null || c === null) return null;

  bUpdated = false;
  cUpdated = false;

  return calculatePosition(a, b, c);
}

export function calculatePosition(a: number, b: number, c: number) {
  const x = (b * b - c * c + a * a) / (2 * a);
  const discriminant = b * b - x * x;
  const y = Math.sqrt(Math.max(0, discriminant));

  const d1 = Math.sqrt(x * x + y * y);
  const d2 = Math.sqrt((x - a) * (x - a) + y * y);

  return {
    anchor1: b,
    anchor2: c,
    x: parseFloat(x.toFixed(3)),
    y: parseFloat(y.toFixed(3)),
    verification: {
      d1: parseFloat(d1.toFixed(3)),
      d2: parseFloat(d2.toFixed(3))
    }
  };
}`;
private conceptInterval: any;

startConceptAnimation(): void {
  this.conceptInterval = setInterval(() => {
    this.displayA1Distance = this.getRandomValue(4.3, 5.4);
    this.displayA2Distance = this.getRandomValue(5.6, 6.8);

    this.displayX = this.getRandomValue(3.8, 5.2);
    this.displayY = this.getRandomValue(4.7, 6.1);
  }, 1400);
}

getRandomValue(min: number, max: number): number {
  return +(Math.random() * (max - min) + min).toFixed(2);
}
todayDate: string = '';

  ngOnInit() {
    this.updateDate();
  }

  updateDate() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    
    // Output format: "Friday, 20 March 2026"
    this.todayDate = now.toLocaleDateString('en-GB', options);
  }

  ngAfterViewInit(): void {
    const cards = document.querySelectorAll('.reveal-card');

    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;

        if (entry.isIntersecting) {
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.15 });

    cards.forEach((card: Element) => {
      const el = card as HTMLElement;
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.8s ease';
      observer.observe(el);
    });
  }
scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId);
  if (!element) return;

  const headerOffset = 120; // unga header height ku match panni maathunga
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

}
