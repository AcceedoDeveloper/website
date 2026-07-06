import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-resistance-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resistance-simulator.component.html',
  styleUrls: ['./resistance-simulator.component.css']
})
export class ResistanceSimulatorComponent implements OnInit, OnDestroy {

  // ----- Slider-bound values -----
  vSource = 18.5;   // Source Voltage (V)
  r1 = 32;          // Resistor 1 (Ω)
  r2 = 24;          // Resistor 2 (Ω)
  r3 = 35;          // Resistor 3 (Ω)

  // ----- Slider ranges -----
  readonly vMin = 0;
  readonly vMax = 24;
  readonly vStep = 0.1;

  readonly rMin = 1;
  readonly rMax = 50;
  readonly rStep = 0.5;

  // ----- Animated current-flow dots -----
  // Each dot has a position expressed as a fraction (0 -> 1) of the
  // total perimeter path. They loop continuously, clockwise.
  dots = [0, 0.25, 0.5, 0.75];
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;

  // Speed of dot travel around the loop, in "loops per second".
  // Scales with current so a bigger current visibly moves faster.
  private readonly baseLoopsPerSecond = 0.18;

  ngOnInit(): void {
    this.lastTimestamp = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private tick = (timestamp: number): void => {
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Current scales dot speed slightly so higher current = faster flow,
    // while keeping things visually smooth even when current is tiny.
    const speedFactor = 0.6 + Math.min(this.current / 0.5, 1.5);
    const advance = this.baseLoopsPerSecond * speedFactor * delta;

    this.dots = this.dots.map(d => (d + advance) % 1);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  // ----- Derived circuit values -----

  get totalResistance(): number {
    return this.r1 + this.r2 + this.r3;
  }

  get current(): number {
    const rTot = this.totalResistance;
    return rTot > 0 ? this.vSource / rTot : 0;
  }

  get vDrop1(): number {
    return this.current * this.r1;
  }

  get vDrop2(): number {
    return this.current * this.r2;
  }

  get vDrop3(): number {
    return this.current * this.r3;
  }

  // ----- Display helpers -----

  fmt1(value: number): string {
    return value.toFixed(1);
  }

  fmt2(value: number): string {
    return value.toFixed(2);
  }

  /**
   * Converts a fractional position (0..1) along the rectangular wire loop
   * into an {x, y} point, used to place each animated current dot.
   *
   * The loop (clockwise starting at the source's top-right corner):
   *   1. down the right side
   *   2. left across the bottom (through R3 -> R2 -> R1 connectors)
   *   3. up the left side
   *   4. right across the top, back into the source
   *
   * Points are expressed in the SVG viewBox coordinate space defined in
   * the template (0 0 500 190).
   */
  getDotPoint(fraction: number): { x: number; y: number } {
    const path = this.perimeterPath;
    const totalLength = path.totalLength;
    const targetLength = ((fraction % 1) + 1) % 1 * totalLength;

    let lengthSoFar = 0;
    for (const seg of path.segments) {
      if (targetLength <= lengthSoFar + seg.length || seg === path.segments[path.segments.length - 1]) {
        const segFraction = seg.length > 0 ? (targetLength - lengthSoFar) / seg.length : 0;
        return {
          x: seg.x1 + (seg.x2 - seg.x1) * segFraction,
          y: seg.y1 + (seg.y2 - seg.y1) * segFraction
        };
      }
      lengthSoFar += seg.length;
    }
    return { x: path.segments[0].x1, y: path.segments[0].y1 };
  }

  // Geometry constants matching the wire path drawn in the template.
  private readonly topY = 18;
  private readonly bottomY = 150;
  private readonly leftX = 20;
  private readonly rightX = 480;
  private readonly sourceLeftX = 195;
  private readonly sourceRightX = 305;

  private get perimeterPath() {
    const segments = [
      // 1. Source right edge -> down the right side
      { x1: this.rightX, y1: this.topY, x2: this.rightX, y2: this.bottomY },
      // 2. Right side -> bottom-left along the resistor row
      { x1: this.rightX, y1: this.bottomY, x2: this.leftX, y2: this.bottomY },
      // 3. Bottom-left -> up the left side
      { x1: this.leftX, y1: this.bottomY, x2: this.leftX, y2: this.topY },
      // 4. Left side -> across the top back to the source
      { x1: this.leftX, y1: this.topY, x2: this.rightX, y2: this.topY }
    ].map(seg => ({
      ...seg,
      length: Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1)
    }));

    const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
    return { segments, totalLength };
  }
}