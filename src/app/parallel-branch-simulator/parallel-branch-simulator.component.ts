import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WireSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
}

interface BranchPath {
  segments: WireSegment[];
  totalLength: number;
}

@Component({
  selector: 'app-parallel-branch-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parallel-branch-simulator.component.html',
  styleUrls: ['./parallel-branch-simulator.component.css']
})
export class ParallelBranchSimulatorComponent implements OnInit, OnDestroy {

  // ----- Slider-bound values -----
  vSource = 15;     // Source Voltage (V)
  r1 = 10;          // Resistor 1 - Top branch (Ω)
  r2 = 14;          // Resistor 2 - Mid branch (Ω)
  r3 = 20;          // Resistor 3 - Bottom branch (Ω)

  // ----- Slider ranges -----
  readonly vMin = 0;
  readonly vMax = 25;
  readonly vStep = 0.1;

  readonly rMin = 1;
  readonly rMax = 50;
  readonly rStep = 0.5;

  // ----- Animated current-flow dots -----
  // Each branch (top / mid / bottom) gets its own independent loop path
  // and its own set of dots, so faster branches visibly move quicker.
  dotsTop = [0, 0.5];
  dotsMid = [0, 0.5];
  dotsBot = [0, 0.5];

  private animationFrameId: number | null = null;
  private lastTimestamp = 0;

  // Base speed (loops per second) before scaling by branch current.
  private readonly baseLoopsPerSecond = 0.15;

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

    this.dotsTop = this.advance(this.dotsTop, this.branchCurrent1, delta);
    this.dotsMid = this.advance(this.dotsMid, this.branchCurrent2, delta);
    this.dotsBot = this.advance(this.dotsBot, this.branchCurrent3, delta);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private advance(dots: number[], branchCurrent: number, delta: number): number[] {
    // Faster branch current -> faster dot travel, with a sensible floor
    // so low-current branches still visibly flow.
    const speedFactor = 0.6 + Math.min(branchCurrent / 1.0, 2);
    const step = this.baseLoopsPerSecond * speedFactor * delta;
    return dots.map(d => (d + step) % 1);
  }

  // ----- Derived circuit values -----

  /** 1/R_tot = 1/R1 + 1/R2 + 1/R3 for resistors in parallel. */
  get totalResistance(): number {
    const reciprocalSum = (1 / this.r1) + (1 / this.r2) + (1 / this.r3);
    return reciprocalSum > 0 ? 1 / reciprocalSum : 0;
  }

  get totalCurrent(): number {
    const rTot = this.totalResistance;
    return rTot > 0 ? this.vSource / rTot : 0;
  }

  // Voltage is the same across every branch in a parallel circuit.
  get branchCurrent1(): number {
    return this.r1 > 0 ? this.vSource / this.r1 : 0;
  }

  get branchCurrent2(): number {
    return this.r2 > 0 ? this.vSource / this.r2 : 0;
  }

  get branchCurrent3(): number {
    return this.r3 > 0 ? this.vSource / this.r3 : 0;
  }

  // ----- Display helpers -----

  fmt1(value: number): string {
    return value.toFixed(1);
  }

  fmt2(value: number): string {
    return value.toFixed(2);
  }

  // ----- Wire geometry (matches the SVG paths in the template) -----
  //
  // Topology:
  //   - Left bus (vertical): source connects in at mid-height
  //   - Top rail runs from the left bus straight into R1 (top branch)
  //   - A second vertical bus drops from the top rail and feeds
  //     R2 (mid) and R3 (bottom) branches
  //   - Each resistor's output joins a shared right-side vertical bus
  //   - That right bus drops down to the bottom rail, which runs
  //     left, back into the source
  //
  // Each branch below is modelled as its own closed loop so dots can
  // travel independently through "their" resistor at "their" speed.

  private readonly leftBusX = 140;
  private readonly midBusX = 270;
  private readonly rightBusX = 460;
  private readonly resistorLeftX = 320;
  private readonly resistorRightX = 420;

  private readonly topY = 30;
  private readonly midY = 90;
  private readonly botY = 150;
  private readonly bottomRailY = 190;

  private buildLoop(branchY: number): BranchPath {
    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [
      // Left bus: bottom rail up to top rail
      { x1: this.leftBusX, y1: this.bottomRailY, x2: this.leftBusX, y2: this.topY },
      // Top rail across to the branch row (only really "visible" for top branch;
      // for mid/bottom this models the equivalent path length through the mid bus)
      { x1: this.leftBusX, y1: this.topY, x2: this.midBusX, y2: this.topY },
      // Down/along the mid bus to this branch's height
      { x1: this.midBusX, y1: this.topY, x2: this.midBusX, y2: branchY },
      // Into the resistor (left stub)
      { x1: this.midBusX, y1: branchY, x2: this.resistorLeftX, y2: branchY },
      // Through/out of the resistor (right stub)
      { x1: this.resistorLeftX, y1: branchY, x2: this.resistorRightX, y2: branchY },
      { x1: this.resistorRightX, y1: branchY, x2: this.rightBusX, y2: branchY },
      // Down the right bus to the bottom rail
      { x1: this.rightBusX, y1: branchY, x2: this.rightBusX, y2: this.bottomRailY },
      // Back along the bottom rail to the left bus
      { x1: this.rightBusX, y1: this.bottomRailY, x2: this.leftBusX, y2: this.bottomRailY }
    ];

    const withLength: WireSegment[] = segments.map(seg => ({
      ...seg,
      length: Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1)
    }));

    const totalLength = withLength.reduce((sum, s) => sum + s.length, 0);
    return { segments: withLength, totalLength };
  }

  // Top branch's "mid bus" segment has zero length (branchY === topY),
  // which is harmless (zero-length segments are simply skipped over).
  private get topLoop(): BranchPath {
    return this.buildLoop(this.topY);
  }

  private get midLoop(): BranchPath {
    return this.buildLoop(this.midY);
  }

  private get botLoop(): BranchPath {
    return this.buildLoop(this.botY);
  }

  private pointOnLoop(loop: BranchPath, fraction: number): { x: number; y: number } {
    const totalLength = loop.totalLength;
    if (totalLength === 0) {
      return { x: loop.segments[0].x1, y: loop.segments[0].y1 };
    }
    const targetLength = ((fraction % 1) + 1) % 1 * totalLength;

    let lengthSoFar = 0;
    for (const seg of loop.segments) {
      if (seg.length > 0 && targetLength <= lengthSoFar + seg.length) {
        const segFraction = (targetLength - lengthSoFar) / seg.length;
        return {
          x: seg.x1 + (seg.x2 - seg.x1) * segFraction,
          y: seg.y1 + (seg.y2 - seg.y1) * segFraction
        };
      }
      lengthSoFar += seg.length;
    }
    const last = loop.segments[loop.segments.length - 1];
    return { x: last.x2, y: last.y2 };
  }

  getTopDotPoint(fraction: number): { x: number; y: number } {
    return this.pointOnLoop(this.topLoop, fraction);
  }

  getMidDotPoint(fraction: number): { x: number; y: number } {
    return this.pointOnLoop(this.midLoop, fraction);
  }

  getBotDotPoint(fraction: number): { x: number; y: number } {
    return this.pointOnLoop(this.botLoop, fraction);
  }
}