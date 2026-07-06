import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/** A single moving charge particle rendered along an SVG wire path. */
interface ChargeParticle {
  id: number;
  /** id of the <path> this particle travels along */
  pathId: string;
  /** 0 -> 1 progress along the path */
  progress: number;
  /** units of progress per millisecond */
  speed: number;
  /** true while bank is charging (source -> caps), false while discharging (caps -> bulbs) */
  direction: 'charge' | 'discharge';
  branch: 1 | 2 | 3 | 0; // 0 = main trunk (source side)
}

/** Per-branch derived electrical readout, recomputed every tick. */
interface BranchReadout {
  id: 1 | 2 | 3;
  label: string;
  capacitanceUF: number;
  chargeUC: number;
  energyUJ: number;
  brightness: number; // 0 -> 1, drives bulb glow
}

type ChargeStatus = 'Charging' | 'Discharging' | 'Steady';

@Component({
  selector: 'app-parallel-capacitor-rc-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parallel-capacitor-rc-simulator.component.html',
  styleUrls: ['./parallel-capacitor-rc-simulator.component.css']
})
export class ParallelCapacitorRcSimulatorComponent implements OnInit, OnDestroy {

  // ---------------------------------------------------------------------
  // User-controlled inputs (bound to sliders / toggle / button)
  // ---------------------------------------------------------------------
  powerOn = false;

  sourceVoltage = 12;     // V,  0 -> 20
  loadResistance = 12;    // Ω,  1 -> 50
  capacitanceC1 = 10;     // µF, 1 -> 100
  capacitanceC2 = 15;     // µF, 1 -> 100
  capacitanceC3 = 20;     // µF, 1 -> 100

  readonly sourceVoltageMin = 0;
  readonly sourceVoltageMax = 20;
  readonly loadResistanceMin = 1;
  readonly loadResistanceMax = 50;
  readonly capMin = 1;
  readonly capMax = 100;

  // ---------------------------------------------------------------------
  // Simulation state
  // ---------------------------------------------------------------------

  /** Instantaneous capacitor-bank voltage (shared across all parallel branches). */
  vCap = 0;

  /** Voltage at the instant the current phase (charge/discharge) began. */
  private phaseStartVoltage = 0;

  /** How many time-constants (tau) have elapsed in the current phase — drives the exponential directly. */
  private phaseTauElapsed = 0;

  /** True-scale RC phase time elapsed, in seconds, derived from phaseTauElapsed * tau. Shown to the user. */
  phaseTimeS = 0;

  status: ChargeStatus = 'Discharging';

  /**
   * How many real-world seconds it takes to animate one full time-constant
   * (tau) of the RC transient. The displayed phase time always reflects the
   * *true* RC timescale (µs/ms/s), but we stretch the wall-clock playback so
   * the eye can actually watch the curve settle, matching the reference video.
   */
  private readonly WALL_SECONDS_PER_TAU = 0.7;

  /** Once the phase has run for this many tau, we call it settled/steady. */
  private readonly SETTLE_TAU_MULTIPLE = 4.5;

  branches: BranchReadout[] = [
    { id: 1, label: 'Branch 1', capacitanceUF: 10, chargeUC: 0, energyUJ: 0, brightness: 0 },
    { id: 2, label: 'Branch 2', capacitanceUF: 15, chargeUC: 0, energyUJ: 0, brightness: 0 },
    { id: 3, label: 'Branch 3', capacitanceUF: 20, chargeUC: 0, energyUJ: 0, brightness: 0 }
  ];

  totalCurrentA = 0;
  storedChargeUC = 0;
  totalEnergyUJ = 0;
  ceqUF = 0;
  tauUS = 0;

  /** Charge percentage of the bank relative to source voltage, 0 -> 100. */
  chargePercent = 0;

  // ---------------------------------------------------------------------
  // Particle animation
  // ---------------------------------------------------------------------
  particles: ChargeParticle[] = [];
  private particleIdCounter = 0;
  private lastFrameTime = 0;
  private animationFrameHandle: number | null = null;

  private readonly mainPathId = 'wire-main';
  private readonly branchPathIds: Record<1 | 2 | 3, string> = {
    1: 'wire-branch-1',
    2: 'wire-branch-2',
    3: 'wire-branch-3'
  };
  private readonly loadPathIds: Record<1 | 2 | 3, string> = {
    1: 'wire-load-1',
    2: 'wire-load-2',
    3: 'wire-load-3'
  };

  private readonly maxParticlesPerPath = 3;
  private spawnAccumulatorMain = 0;
  private spawnAccumulatorBranch: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngOnInit(): void {
    this.syncBranchCapacitances();
    this.recomputeStaticDerived();
    this.startLoop();
  }

  ngOnDestroy(): void {
    if (this.animationFrameHandle !== null) {
      cancelAnimationFrame(this.animationFrameHandle);
    }
  }

  // ---------------------------------------------------------------------
  // Public UI event handlers
  // ---------------------------------------------------------------------

  togglePower(): void {
    this.powerOn = !this.powerOn;
    this.beginNewPhase();
  }

  onSliderChange(): void {
    // Sliders adjust instantaneous parameters; equivalent capacitance / tau
    // are recalculated continuously inside the animation loop, but switching
    // a capacitor value mid-transient should not reset accumulated charge.
    this.syncBranchCapacitances();
    this.recomputeStaticDerived();
  }

  get powerButtonLabel(): string {
    return this.powerOn ? 'Power\nON' : 'Power\nOFF';
  }

  // ---------------------------------------------------------------------
  // Core RC physics
  // ---------------------------------------------------------------------

  private syncBranchCapacitances(): void {
    this.branches[0].capacitanceUF = this.capacitanceC1;
    this.branches[1].capacitanceUF = this.capacitanceC2;
    this.branches[2].capacitanceUF = this.capacitanceC3;
  }

  private recomputeStaticDerived(): void {
    this.ceqUF = this.capacitanceC1 + this.capacitanceC2 + this.capacitanceC3;
    const ceqFarads = this.ceqUF * 1e-6;
    this.tauUS = this.loadResistance * ceqFarads * 1e6; // R(Ω) * C(F) -> seconds -> µs
  }

  /** Called whenever the power state flips, to anchor the exponential phase. */
  private beginNewPhase(): void {
    this.phaseStartVoltage = this.vCap;
    this.phaseTauElapsed = 0;
    this.phaseTimeS = 0;
    this.status = this.powerOn ? 'Charging' : 'Discharging';
  }

  /**
   * Advances the RC transient by dtWallSeconds of real wall-clock time and
   * refreshes every derived readout. Internally we convert wall-clock time
   * into "tau units" elapsed (so playback speed is constant regardless of
   * how small/large the true RC tau is), then convert back to true RC
   * seconds purely for display purposes.
   */
  private stepPhysics(dtWallSeconds: number): void {
    this.recomputeStaticDerived();
    const ceqFarads = this.ceqUF * 1e-6;
    const tauSeconds = Math.max(this.loadResistance * ceqFarads, 1e-9);

    this.phaseTauElapsed += dtWallSeconds / this.WALL_SECONDS_PER_TAU;
    this.phaseTimeS = this.phaseTauElapsed * tauSeconds;

    if (this.powerOn) {
      // Vc(t) = Vs - (Vs - V0) * e^(-t/RC)   [equivalent to Vs*(1-e^-t/RC) when V0=0]
      const target = this.sourceVoltage;
      this.vCap = target - (target - this.phaseStartVoltage) * Math.exp(-this.phaseTauElapsed);
    } else {
      // Vc(t) = V0 * e^(-t/RC)
      this.vCap = this.phaseStartVoltage * Math.exp(-this.phaseTauElapsed);
    }

    if (this.vCap < 0.0005) {
      this.vCap = 0;
    }

    // Current through the shared resistive load path:
    // I(t) = (Vs - Vc)/R while charging, Vc/R while discharging.
    if (this.powerOn) {
      this.totalCurrentA = (this.sourceVoltage - this.vCap) / this.loadResistance;
    } else {
      this.totalCurrentA = -(this.vCap / this.loadResistance);
    }

    // Per-branch charge & energy: all branches share the bank voltage (parallel).
    let totalQ = 0;
    let totalE = 0;
    for (const b of this.branches) {
      const cFarads = b.capacitanceUF * 1e-6;
      const qCoulombs = cFarads * this.vCap;
      const eJoules = 0.5 * cFarads * this.vCap * this.vCap;
      b.chargeUC = qCoulombs * 1e6;
      b.energyUJ = eJoules * 1e6;
      b.brightness = this.sourceVoltage > 0 ? Math.max(0, Math.min(1, this.vCap / this.sourceVoltage)) : 0;
      totalQ += b.chargeUC;
      totalE += b.energyUJ;
    }
    this.storedChargeUC = totalQ;
    this.totalEnergyUJ = totalE;
    this.chargePercent = this.sourceVoltage > 0
      ? Math.max(0, Math.min(100, (this.vCap / this.sourceVoltage) * 100))
      : 0;

    // Determine status label: settled once enough tau have elapsed.
    if (this.phaseTauElapsed >= this.SETTLE_TAU_MULTIPLE) {
      this.status = 'Steady';
    } else {
      this.status = this.powerOn ? 'Charging' : 'Discharging';
    }
  }

  // ---------------------------------------------------------------------
  // Animation loop (requestAnimationFrame) — drives physics + particles.
  // No direct DOM manipulation: everything flows back through bound fields.
  // ---------------------------------------------------------------------

  private startLoop(): void {
    this.zone.runOutsideAngular(() => {
      this.lastFrameTime = performance.now();
      const loop = (now: number) => {
        const dtMs = Math.min(now - this.lastFrameTime, 50); // clamp for tab-switch hiccups
        this.lastFrameTime = now;

        const dtWallSeconds = dtMs / 1000;
        this.stepPhysics(dtWallSeconds);
        this.advanceParticles(dtMs);
        this.maybeSpawnParticles(dtMs);

        // Push one batched update into Angular's change detection per frame.
        this.zone.run(() => this.cdr.markForCheck());

        this.animationFrameHandle = requestAnimationFrame(loop);
      };
      this.animationFrameHandle = requestAnimationFrame(loop);
    });
  }

  private advanceParticles(dtMs: number): void {
    const next: ChargeParticle[] = [];
    for (const p of this.particles) {
      p.progress += p.speed * dtMs;
      if (p.progress < 1) {
        next.push(p);
      }
      // particles that complete their path are simply dropped (faded loop)
    }
    this.particles = next;
  }

  private maybeSpawnParticles(dtMs: number): void {
    const currentMag = Math.abs(this.totalCurrentA);
    if (currentMag < 0.002) {
      return; // negligible current -> no visible particle motion
    }

    // Spawn rate scales gently with current magnitude so faster transients
    // look busier, but stays capped to avoid visual clutter.
    const baseRatePerSecond = 1.2 + Math.min(currentMag * 6, 5);
    this.spawnAccumulatorMain += (dtMs / 1000) * baseRatePerSecond;

    const mainCount = this.particles.filter(p => p.pathId === this.mainPathId).length;
    if (this.spawnAccumulatorMain >= 1 && mainCount < this.maxParticlesPerPath) {
      this.spawnAccumulatorMain -= 1;
      this.spawnParticle(this.mainPathId, 0, this.powerOn ? 'charge' : 'discharge');
    }

    for (const id of [1, 2, 3] as const) {
      this.spawnAccumulatorBranch[id] += (dtMs / 1000) * (baseRatePerSecond * 0.7);
      const pathId = this.powerOn ? this.branchPathIds[id] : this.loadPathIds[id];
      const count = this.particles.filter(p => p.pathId === pathId).length;
      if (this.spawnAccumulatorBranch[id] >= 1 && count < this.maxParticlesPerPath) {
        this.spawnAccumulatorBranch[id] -= 1;
        this.spawnParticle(pathId, id, this.powerOn ? 'charge' : 'discharge');
      }
    }
  }

  private spawnParticle(pathId: string, branch: 0 | 1 | 2 | 3, direction: 'charge' | 'discharge'): void {
    this.particles.push({
      id: this.particleIdCounter++,
      pathId,
      progress: 0,
      speed: 0.0009 + Math.random() * 0.0006, // progress-units per ms
      direction,
      branch
    });
  }

  // ---------------------------------------------------------------------
  // Template helper getters (pure, no side effects — safe for change detection)
  // ---------------------------------------------------------------------

  get dcSourceLabel(): string {
    const v = this.powerOn ? this.sourceVoltage : 0;
    return `${v.toFixed(1)} V`;
  }

  get ceqEquationText(): string {
    return `${this.capacitanceC1} + ${this.capacitanceC2} + ${this.capacitanceC3} = ${this.ceqUF.toFixed(1)} µF`;
  }

  get tauDisplay(): string {
    if (this.tauUS < 1000) {
      return `${this.tauUS.toFixed(1)} µs`;
    } else if (this.tauUS < 1_000_000) {
      return `${(this.tauUS / 1000).toFixed(2)} ms`;
    }
    return `${(this.tauUS / 1_000_000).toFixed(3)} s`;
  }

  get tauEquationText(): string {
    return `${this.loadResistance.toFixed(1)}Ω × ${this.ceqUF.toFixed(1)}µF`;
  }

  get currentEquationText(): string {
    return this.powerOn
      ? `${this.sourceVoltage.toFixed(1)}V − ${this.vCap.toFixed(2)}V over R`
      : `${this.vCap.toFixed(2)}V over R (discharge)`;
  }

  /** Phase time shown to the user, on the true RC timescale (µs/ms/s), adaptively formatted. */
  get phaseTimeDisplay(): string {
    const us = this.phaseTimeS * 1e6;
    if (us < 1000) {
      return `${us.toFixed(2)} µs`;
    } else if (us < 1_000_000) {
      return `${(us / 1000).toFixed(2)} ms`;
    }
    return `${(us / 1_000_000).toFixed(3)} s`;
  }

  /** Returns branch charge equation text, e.g. "10.0uF x 0.23V" */
  branchEquation(b: BranchReadout): string {
    return `${b.capacitanceUF.toFixed(1)}uF × ${this.vCap.toFixed(2)}V`;
  }

  get energyEquationText(): string {
    return `0.5 × ${(this.ceqUF * 1e-6).toFixed(6)}F × ${this.vCap.toFixed(2)}V^2`;
  }

  particleDirectionClass(p: ChargeParticle): string {
    return p.direction === 'charge' ? 'particle-charge' : 'particle-discharge';
  }

  trackParticle(_index: number, p: ChargeParticle): number {
    return p.id;
  }

  /**
   * Straight-line endpoint definitions matching the SVG paths drawn in the
   * template (viewBox 0 0 400 300). Kept in one place so particle motion
   * always tracks the visible wires exactly.
   */
  private readonly pathEndpoints: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
    'wire-main': { x1: 70, y1: 90, x2: 70, y2: 210 },
    'wire-branch-1': { x1: 70, y1: 90, x2: 150, y2: 90 },
    'wire-branch-2': { x1: 70, y1: 150, x2: 150, y2: 150 },
    'wire-branch-3': { x1: 70, y1: 210, x2: 150, y2: 210 },
    'wire-load-1': { x1: 250, y1: 90, x2: 320, y2: 90 },
    'wire-load-2': { x1: 250, y1: 150, x2: 320, y2: 150 },
    'wire-load-3': { x1: 250, y1: 210, x2: 320, y2: 210 }
  };

  private interpolatedPoint(p: ChargeParticle): { x: number; y: number } {
    const seg = this.pathEndpoints[p.pathId];
    if (!seg) {
      return { x: 0, y: 0 };
    }
    // Discharge particles travel the path in reverse (load -> source feel).
    const t = p.direction === 'discharge' ? 1 - p.progress : p.progress;
    const x = seg.x1 + (seg.x2 - seg.x1) * t;
    const y = seg.y1 + (seg.y2 - seg.y1) * t;
    return { x, y };
  }

  particleX(p: ChargeParticle): number {
    return this.interpolatedPoint(p).x;
  }

  particleY(p: ChargeParticle): number {
    return this.interpolatedPoint(p).y;
  }
}