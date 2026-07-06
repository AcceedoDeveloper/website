import {
  Component,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  Signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Simulation lifecycle state for the capacitor bank. */
type ChargeState = 'idle' | 'charging' | 'charged' | 'discharging' | 'discharged';

/** A single moving charge particle travelling along the wire loop. */
interface ChargeParticle {
  id: number;
  /** 0 -> 1 normalized position along the full wire path. */
  position: number;
}

/** Row of read-only data displayed in the information / results panel. */
interface InfoRow {
  label: string;
  formula: string;
  value: string;
  accent: 'blue' | 'green' | 'pink' | 'purple';
}

@Component({
  selector: 'app-series-capacitor-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './series-capacitor-simulator.component.html',
  styleUrl: './series-capacitor-simulator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeriesCapacitorSimulatorComponent implements OnDestroy {

  // ---------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------

  readonly VOLTAGE_MIN = 0;
  readonly VOLTAGE_MAX = 20;
  readonly CAP_MIN = 1;
  readonly CAP_MAX = 100;

  /** How long a full charge / discharge cycle takes, in milliseconds. */
  private readonly CYCLE_DURATION_MS = 4000;
  /** Animation frame tick rate for the progress + particle loop. */
  private readonly TICK_MS = 30;
  /** Number of glowing particles travelling the loop while current flows. */
  private readonly PARTICLE_COUNT = 6;

  // ---------------------------------------------------------------------
  // Reactive inputs (signals) - bound to the sliders / switch
  // ---------------------------------------------------------------------

  readonly sourceVoltage = signal<number>(12);
  readonly capacitance1 = signal<number>(10);
  readonly capacitance2 = signal<number>(15);
  readonly capacitance3 = signal<number>(20);

  readonly powerOn = signal<boolean>(false);

  // ---------------------------------------------------------------------
  // Simulation state
  // ---------------------------------------------------------------------

  /** 0 -> 100, how charged the capacitor bank currently is. */
  readonly chargePercent = signal<number>(0);
  readonly chargeState = signal<ChargeState>('idle');
  readonly particles = signal<ChargeParticle[]>([]);

  private animationHandle: ReturnType<typeof setInterval> | null = null;
  private cycleStartPercent = 0;
  private cycleStartTime = 0;
  private particleSeed = 0;

  // ---------------------------------------------------------------------
  // Derived / computed values - pure functions of the signals above
  // ---------------------------------------------------------------------

  /** Equivalent series capacitance in microfarads: 1/Ceq = 1/C1 + 1/C2 + 1/C3 */
  readonly equivalentCapacitance: Signal<number> = computed(() => {
    const c1 = this.capacitance1();
    const c2 = this.capacitance2();
    const c3 = this.capacitance3();
    const reciprocalSum = (1 / c1) + (1 / c2) + (1 / c3);
    return reciprocalSum > 0 ? 1 / reciprocalSum : 0;
  });

  /** Charge fully stored at 100%, in microcoulombs: Q = Ceq x V */
  readonly fullCharge: Signal<number> = computed(() => {
    return this.equivalentCapacitance() * this.sourceVoltage();
  });

  /** Charge presently stored, scaled by the animated charging percentage. */
  readonly storedCharge: Signal<number> = computed(() => {
    return this.fullCharge() * (this.chargePercent() / 100);
  });

  /** Voltage presently appearing across C1: V1 = Q / C1 */
  readonly voltage1: Signal<number> = computed(() => {
    const c1 = this.capacitance1();
    return c1 > 0 ? this.storedCharge() / c1 : 0;
  });

  /** Voltage presently appearing across C2: V2 = Q / C2 */
  readonly voltage2: Signal<number> = computed(() => {
    const c2 = this.capacitance2();
    return c2 > 0 ? this.storedCharge() / c2 : 0;
  });

  /** Voltage presently appearing across C3: V3 = Q / C3 */
  readonly voltage3: Signal<number> = computed(() => {
    const c3 = this.capacitance3();
    return c3 > 0 ? this.storedCharge() / c3 : 0;
  });

  /** Energy presently stored, in microjoules: E = 1/2 x Ceq x V^2 (scaled by charge progress). */
  readonly storedEnergy: Signal<number> = computed(() => {
    const ceq = this.equivalentCapacitance();
    const v = this.sourceVoltage();
    const fraction = this.chargePercent() / 100;
    // Energy scales with the square of the charge fraction (E = Q^2 / 2C)
    return 0.5 * ceq * v * v * fraction * fraction;
  });

  /** True while electrons are actively moving (charging or discharging). */
  readonly isFlowing: Signal<boolean> = computed(() => {
    const state = this.chargeState();
    const hasVoltage = this.sourceVoltage() > 0;
    return (state === 'charging' || state === 'discharging') && hasVoltage;
  });

  /** Direction multiplier for particle travel: +1 charging, -1 discharging. */
  readonly flowDirection: Signal<number> = computed(() => {
    return this.chargeState() === 'discharging' ? -1 : 1;
  });

  /** Relative animation speed - particles move faster at higher source voltage. */
  readonly flowSpeedFactor: Signal<number> = computed(() => {
    const v = this.sourceVoltage();
    const normalized = (v - this.VOLTAGE_MIN) / (this.VOLTAGE_MAX - this.VOLTAGE_MIN || 1);
    return 0.5 + normalized * 1.5; // ranges roughly 0.5x -> 2x speed
  });

  /** Bulb brightness 0 -> 1. Glows while flowing, settles dim once charged/discharged. */
  readonly bulbBrightness: Signal<number> = computed(() => {
    // No source voltage means no driving current, so the bulb never lights -
    // regardless of where the cosmetic charge-percent animation sits.
    const voltageFactor = Math.min(1, this.sourceVoltage() / 3);
    if (voltageFactor <= 0) return 0;

    const state = this.chargeState();
    if (state === 'charging' || state === 'discharging') {
      // Brightest mid-flow, tapering near both ends for a realistic feel.
      const pct = this.chargePercent() / 100;
      const taper = state === 'charging' ? (1 - pct) : pct;
      return voltageFactor * (0.35 + taper * 0.65);
    }
    if (state === 'charged') return voltageFactor * 0.12; // steady DC - capacitor blocks current
    return 0; // idle / discharged / off
  });

  readonly isFullyCharged: Signal<boolean> = computed(() => this.chargeState() === 'charged');
  readonly isFullyDischarged: Signal<boolean> = computed(() => this.chargeState() === 'discharged' || this.chargeState() === 'idle');

  readonly statusLabel: Signal<string> = computed(() => {
    switch (this.chargeState()) {
      case 'charging': return 'Charging';
      case 'charged': return 'Fully Charged';
      case 'discharging': return 'Discharging';
      case 'discharged': return 'Discharged';
      default: return 'Idle';
    }
  });

  readonly canDischarge: Signal<boolean> = computed(() => {
    const state = this.chargeState();
    return this.chargePercent() > 0 && state !== 'discharging';
  });

  /** Rows for the bottom information / results panel. */
  readonly infoRows: Signal<InfoRow[]> = computed(() => {
    const ceq = this.equivalentCapacitance();
    const q = this.storedCharge();
    const e = this.storedEnergy();
    return [
      {
        label: 'Source Voltage',
        formula: 'V',
        value: `${this.sourceVoltage().toFixed(1)} V`,
        accent: 'blue'
      },
      {
        label: 'Equivalent Capacitance',
        formula: `1/(1/${this.capacitance1().toFixed(0)} + 1/${this.capacitance2().toFixed(0)} + 1/${this.capacitance3().toFixed(0)})`,
        value: `${ceq.toFixed(2)} \u00b5F`,
        accent: 'blue'
      },
      {
        label: 'Stored Charge',
        formula: 'Q = Ceq \u00d7 V',
        value: `${q.toFixed(2)} \u00b5C`,
        accent: 'purple'
      },
      {
        label: 'Voltage Across C1',
        formula: 'V1 = Q / C1',
        value: `${this.voltage1().toFixed(2)} V`,
        accent: 'pink'
      },
      {
        label: 'Voltage Across C2',
        formula: 'V2 = Q / C2',
        value: `${this.voltage2().toFixed(2)} V`,
        accent: 'pink'
      },
      {
        label: 'Voltage Across C3',
        formula: 'V3 = Q / C3',
        value: `${this.voltage3().toFixed(2)} V`,
        accent: 'pink'
      },
      {
        label: 'Stored Energy',
        formula: 'E = \u00bd \u00d7 Ceq \u00d7 V\u00b2',
        value: `${e.toFixed(2)} \u00b5J`,
        accent: 'green'
      }
    ];
  });

  /** SVG stroke-dashoffset style helper for plate glow intensity per capacitor. */
  readonly plateGlow1: Signal<number> = computed(() => this.capacitorGlow(this.voltage1(), this.sourceVoltage()));
  readonly plateGlow2: Signal<number> = computed(() => this.capacitorGlow(this.voltage2(), this.sourceVoltage()));
  readonly plateGlow3: Signal<number> = computed(() => this.capacitorGlow(this.voltage3(), this.sourceVoltage()));

  private capacitorGlow(vAcross: number, vSource: number): number {
    if (vSource <= 0) return 0;
    // Use charge percent so all three plates glow together as the bank charges,
    // independent of how the voltage happens to split across unequal capacitors.
    return Math.min(1, this.chargePercent() / 100) * Math.min(1, vSource / 3);
  }

  constructor() {
    // Keep the displayed numeric inputs always within their valid ranges
    // even if bound via two-way binding from a malformed paste, etc.
    effect(() => {
      const v = this.sourceVoltage();
      if (v < this.VOLTAGE_MIN || v > this.VOLTAGE_MAX) {
        this.sourceVoltage.set(this.clamp(v, this.VOLTAGE_MIN, this.VOLTAGE_MAX));
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAnimationLoop();
  }

  // ---------------------------------------------------------------------
  // Slider input handlers (Angular event bindings)
  // ---------------------------------------------------------------------

  onVoltageChange(value: number): void {
    this.sourceVoltage.set(this.clamp(value, this.VOLTAGE_MIN, this.VOLTAGE_MAX));
  }

  onCapacitance1Change(value: number): void {
    this.capacitance1.set(this.clamp(value, this.CAP_MIN, this.CAP_MAX));
  }

  onCapacitance2Change(value: number): void {
    this.capacitance2.set(this.clamp(value, this.CAP_MIN, this.CAP_MAX));
  }

  onCapacitance3Change(value: number): void {
    this.capacitance3.set(this.clamp(value, this.CAP_MIN, this.CAP_MAX));
  }

  // ---------------------------------------------------------------------
  // Power switch + discharge button handlers
  // ---------------------------------------------------------------------

  /** Toggles power. ON kicks off charging from the current level; OFF reverses into discharge. */
  togglePower(): void {
    if (this.powerOn()) {
      this.powerOn.set(false);
      this.beginDischarge();
    } else {
      this.powerOn.set(true);
      this.beginCharge();
    }
  }

  /** Explicit Discharge button - always drains the bank regardless of switch position. */
  discharge(): void {
    if (!this.canDischarge()) return;
    this.powerOn.set(false);
    this.beginDischarge();
  }

  private beginCharge(): void {
    if (this.chargePercent() >= 100) {
      this.chargeState.set('charged');
      return;
    }
    this.chargeState.set('charging');
    this.startAnimationLoop();
  }

  private beginDischarge(): void {
    if (this.chargePercent() <= 0) {
      this.chargeState.set('discharged');
      this.particles.set([]);
      return;
    }
    this.chargeState.set('discharging');
    this.startAnimationLoop();
  }

  // ---------------------------------------------------------------------
  // Animation loop - drives charge percentage ramp + particle positions
  // ---------------------------------------------------------------------

  private startAnimationLoop(): void {
    this.stopAnimationLoop();
    this.cycleStartPercent = this.chargePercent();
    this.cycleStartTime = performance.now();
    this.seedParticles();

    this.animationHandle = setInterval(() => {
      this.tick();
    }, this.TICK_MS);
  }

  private stopAnimationLoop(): void {
    if (this.animationHandle !== null) {
      clearInterval(this.animationHandle);
      this.animationHandle = null;
    }
  }

  private seedParticles(): void {
    const list: ChargeParticle[] = [];
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      list.push({
        id: this.particleSeed++,
        position: i / this.PARTICLE_COUNT
      });
    }
    this.particles.set(list);
  }

  private tick(): void {
    const state = this.chargeState();
    if (state !== 'charging' && state !== 'discharging') {
      this.stopAnimationLoop();
      return;
    }

    const elapsed = performance.now() - this.cycleStartTime;
    const remainingDistance = state === 'charging'
      ? 100 - this.cycleStartPercent
      : this.cycleStartPercent;

    // Ease-out style progress so the rate slows as the bank approaches
    // full charge / full discharge, echoing real capacitor behaviour.
    const rawProgress = Math.min(1, elapsed / this.CYCLE_DURATION_MS);
    const eased = 1 - Math.pow(1 - rawProgress, 2);

    let newPercent: number;
    if (state === 'charging') {
      newPercent = this.cycleStartPercent + remainingDistance * eased;
    } else {
      newPercent = this.cycleStartPercent - remainingDistance * eased;
    }
    newPercent = this.clamp(newPercent, 0, 100);
    this.chargePercent.set(newPercent);

    // Advance particle positions along the wire loop. Speed reacts to the
    // configured source voltage and slows naturally as flow tapers off.
    const speed = this.flowSpeedFactor();
    const direction = this.flowDirection();
    const flowTaper = state === 'charging' ? (1 - eased) : eased;
    const step = 0.012 * speed * Math.max(0.15, flowTaper) * direction;

    this.particles.update(list =>
      list.map(p => {
        let next = p.position + step;
        if (next > 1) next -= 1;
        if (next < 0) next += 1;
        return { ...p, position: next };
      })
    );

    if (rawProgress >= 1) {
      if (state === 'charging') {
        this.chargeState.set('charged');
      } else {
        this.chargeState.set('discharged');
        this.particles.set([]);
      }
      this.stopAnimationLoop();
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  /** Helper used by the template to format a number to N decimals safely. */
  formatNumber(value: number, decimals: number = 1): string {
    if (!isFinite(value)) return '0.0';
    return value.toFixed(decimals);
  }

  // ---------------------------------------------------------------------
  // Wire-path geometry helpers
  //
  // The wire loop is drawn as a simple rectangle in a 600x320 viewBox:
  //   top-left (60,60) -> top-right (540,60) -> bottom-right (540,230)
  //   -> bottom-left (60,230) -> back to top-left.
  // Particles travel this perimeter using a single normalized 0->1
  // "position" value, walked clockwise starting at the top-left corner.
  // ---------------------------------------------------------------------

  private readonly pathPoints = [
    { x: 60, y: 60 },   // top-left
    { x: 540, y: 60 },  // top-right
    { x: 540, y: 230 }, // bottom-right
    { x: 60, y: 230 },  // bottom-left
    { x: 60, y: 60 }    // back to start
  ];

  private readonly segmentLengths = this.computeSegmentLengths();
  private readonly totalLength = this.segmentLengths.reduce((a, b) => a + b, 0);

  private computeSegmentLengths(): number[] {
    const lens: number[] = [];
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const a = this.pathPoints[i];
      const b = this.pathPoints[i + 1];
      lens.push(Math.hypot(b.x - a.x, b.y - a.y));
    }
    return lens;
  }

  /** Resolves a normalized 0->1 loop position to an {x, y} point on the rectangle. */
  private pointAt(t: number): { x: number; y: number } {
    const clamped = ((t % 1) + 1) % 1; // wrap into [0, 1)
    let distance = clamped * this.totalLength;

    for (let i = 0; i < this.segmentLengths.length; i++) {
      const segLen = this.segmentLengths[i];
      if (distance <= segLen || i === this.segmentLengths.length - 1) {
        const ratio = segLen > 0 ? distance / segLen : 0;
        const a = this.pathPoints[i];
        const b = this.pathPoints[i + 1];
        return {
          x: a.x + (b.x - a.x) * ratio,
          y: a.y + (b.y - a.y) * ratio
        };
      }
      distance -= segLen;
    }
    return this.pathPoints[0];
  }

  particleX(position: number): number {
    return this.pointAt(position).x;
  }

  particleY(position: number): number {
    return this.pointAt(position).y;
  }
}