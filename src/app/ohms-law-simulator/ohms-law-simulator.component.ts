import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';

@Component({
  selector: 'app-ohms-law-simulator',
  templateUrl: './ohms-law-simulator.component.html',
  styleUrls: ['./ohms-law-simulator.component.css']
})
export class OhmsLawSimulatorComponent
implements AfterViewInit {

  @ViewChild('electronCloud')
  electronCloud!: ElementRef<SVGGElement>;

  @ViewChild('circuitPath')
  circuitPath!: ElementRef<SVGPathElement>;

  voltage = 12;
  resistance = 6;
  current = 2;

  resistorTransform =
    'translate(0,0) scale(1,1)';

  electrons: any[] = [];
  pathLength = 0;
  lastTime = 0;

  constructor() {
    this.updateCircuit();
  }

  ngAfterViewInit(): void {

    const cloud =
      this.electronCloud.nativeElement;

    const path =
      this.circuitPath.nativeElement;

    this.pathLength =
      path.getTotalLength();

    for (let i = 0; i < 20; i++) {

      const circle =
        document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle'
        );

      circle.setAttribute('r', '4');
      circle.setAttribute('class', 'electron');

      cloud.appendChild(circle);

      this.electrons.push({
        element: circle,
        progress:
          (i / 20) * this.pathLength
      });
    }

    requestAnimationFrame(
      this.animateElectrons
    );
  }

  updateCircuit(): void {

    this.current =
      +(this.voltage / this.resistance)
        .toFixed(2);

    const baseR = 6;

    const scaleX =
      Math.max(
        0.4,
        Math.min(
          1.4,
          baseR / this.resistance
        )
      );

    const scaleY =
      Math.max(
        0.4,
        Math.min(
          1.2,
          baseR / this.resistance
        )
      );

    this.resistorTransform = '';
  }

  animateElectrons = (
    timestamp: number
  ): void => {

    const path =
      this.circuitPath.nativeElement;

    if (!this.lastTime) {
      this.lastTime = timestamp;
    }

    const delta =
      (timestamp - this.lastTime) / 16;

    this.lastTime = timestamp;

    this.electrons.forEach(
      electron => {

        electron.progress -=
          this.current *
          0.8 *
          delta;

        if (
          electron.progress < 0
        ) {
          electron.progress +=
            this.pathLength;
        }

        const point =
          path.getPointAtLength(
            electron.progress
          );

        electron.element.setAttribute(
          'cx',
          point.x
        );

        electron.element.setAttribute(
          'cy',
          point.y
        );
      }
    );

    requestAnimationFrame(
      this.animateElectrons
    );
  };

}