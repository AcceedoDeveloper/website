import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

/**
 * Possible states for the stored-magnetic-energy badge.
 */
type EnergyPhase = 'Charging' | 'Steady' | 'Discharging';

/**
 * Series Inductors in an RL Circuit — interactive simulator.
 *
 * Models a single series loop:
 *   DC Step Source -> Switch -> L1 -> L2 -> L3 -> Bulb (load) -> back to source
 *
 * Because the three inductors are in series they behave as a single
 * equivalent inductor L_eq = L1 + L2 + L3, sharing one common current i(t).
 * The bulb is the one shared load, so its brightness only depends on i(t).
 */
@Component({
  selector: 'app-rl-circuit-simulator',
  templateUrl: './rl-circuit-simulator.component.html',
  styleUrls: ['./rl-circuit-simulator.component.css']
})
export class RlCircuitSimulatorComponent implements OnInit, OnDestroy {

  // ---------------------------------------------------------------------
  // Control state
  // ---------------------------------------------------------------------

  /** Power switch state. true = ON (source connected), false = OFF (source removed, loop free-wheels). */
  powerOn = false;

  /** DC source voltage, 0–50 V. */
  sourceVoltage = 10.0;

  /** Series load resistance, 1–100 Ω. */
  loadResistance = 52.0;

  /** Inductor values in mH, 1–100 each. */
  inductorL1 = 10.0;
  inductorL2 = 15.0;
  inductorL3 = 20.0;

  // ---------------------------------------------------------------------
  // Simulation state (derived every tick)
  // ---------------------------------------------------------------------

  /** Equivalent series inductance in mH. */
  lEq = 0;

  /** Time constant in ms. */
  timeConstant = 0;

  /** Instantaneous current in A. */
  current = 0;

  /** Current at the instant of the last switch transition (A). */
  private i0 = 0;

  /** Voltage actually applied to the RL branch right now (V). Source voltage while ON, 0 while OFF. */
  private appliedVoltage = 0;

  /** Total inductor voltage V_L(t) = appliedVoltage - i*R. */
  totalInductorVoltage = 0;

  /** Per-inductor voltage division (proportional to each L / L_eq). */
  voltageL1 = 0;
  voltageL2 = 0;
  voltageL3 = 0;

  /** Stored magnetic energy in mJ: E = 1/2 * L_eq * i^2 (L_eq in H). */
  storedEnergy = 0;

  /** Energy percentage (0-100) used to fill the progress bar, relative to max possible energy at current settings. */
  energyPercent = 0;

  /** Badge text shown next to the energy bar. */
  energyPhase: EnergyPhase = 'Steady';

  /** Elapsed simulated time (s) since the last power transition — drives the exponential. */
  private elapsed = 0;

  /** Wall-clock timestamp of last animation tick, used to integrate elapsed time. */
  private lastTickTime = 0;

  /** requestAnimationFrame handle. */
  private rafHandle: number | null = null;

  /** Electron / current-particle animation phase, 0-1, looped. Speed scales with current magnitude. */
  particlePhase = 0;

  /** Live display strings for the formula breakdown panel (rebuilt every tick). */
  lEqFormula = '';
  timeConstantFormula = '';
  currentFormula = '';
  totalVoltageFormula = '';
  voltageL1Formula = '';
  voltageL2Formula = '';
  voltageL3Formula = '';
  storedEnergyFormula = '';

  /** "Remaining energy" / "Phase time" caption strings under the progress bar. */
  remainingEnergyLabel = '0.0 mJ';
  phaseTimeLabel = '0.00 ms';

  // ---------------------------------------------------------------------
  // SVG geometry — single closed loop: Source -> right -> Bulb -> L3 -> L2 -> L1 -> Source
  // Coordinates correspond to the viewBox used in the template (0 0 440 260).
  // ---------------------------------------------------------------------
  readonly wirePath =
    'M 70,40 L 70,95 L 70,150 L 70,205 ' +     // left rail down to L1 junction
    'L 175,205 ' +                              // into L1 (handled visually by component box)
    'L 175,205 L 245,205 ' +                    // L1 -> L2
    'L 315,205 ' +                               // L2 -> L3
    'L 370,205 L 370,150 L 370,95 L 370,60 ' +  // right rail up from bulb to top
    'L 370,40 L 70,40';                          // top rail back to source

  /** Number of glowing particles travelling the loop at once. */
  readonly particleCount = 4;

  // ---------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.recompute(0);
    this.lastTickTime = performance.now();
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  ngOnDestroy(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
    }
  }

  // ---------------------------------------------------------------------
  // Animation loop
  // ---------------------------------------------------------------------

  /** Bound tick function passed to requestAnimationFrame. */
  private tick = (now: number): void => {
    const dtMs = now - this.lastTickTime;
    this.lastTickTime = now;
    const dt = Math.min(dtMs, 100) / 1000; // clamp huge gaps (tab switch), convert to seconds

    this.elapsed += dt;
    this.recompute(this.elapsed);

    // Particle motion: speed proportional to |current|, always a minimum
    // crawl so the loop never looks fully dead, frozen only when truly at 0.
    const speedFactor = 0.15 + Math.min(Math.abs(this.current) * 0.9, 1.6);
    if (this.powerOn || Math.abs(this.current) > 0.005) {
      this.particlePhase = (this.particlePhase + dt * speedFactor * 0.18) % 1;
    }

    this.cdr.markForCheck();
    this.rafHandle = requestAnimationFrame(this.tick);
  };

  // ---------------------------------------------------------------------
  // Control handlers
  // ---------------------------------------------------------------------

  togglePower(): void {
    this.powerOn = !this.powerOn;
    this.onTransition();
  }

  onSourceVoltageChange(value: number): void {
    this.sourceVoltage = value;
    this.onTransition();
  }

  onLoadResistanceChange(value: number): void {
    this.loadResistance = Math.max(1, value);
    this.onTransition();
  }

  onInductorChange(which: 'L1' | 'L2' | 'L3', value: number): void {
    if (which === 'L1') this.inductorL1 = value;
    if (which === 'L2') this.inductorL2 = value;
    if (which === 'L3') this.inductorL3 = value;
    this.onTransition();
  }

  reset(): void {
    this.powerOn = false;
    this.sourceVoltage = 10.0;
    this.loadResistance = 52.0;
    this.inductorL1 = 10.0;
    this.inductorL2 = 15.0;
    this.inductorL3 = 20.0;
    this.i0 = 0;
    this.elapsed = 0;
    this.recompute(0);
  }

  /**
   * Called whenever any control changes. Re-anchors the exponential at the
   * current instantaneous current (i0) and resets the elapsed-time clock,
   * exactly as a real RL transient restarts whenever R, L, or V step.
   */
  private onTransition(): void {
    this.i0 = this.current;
    this.appliedVoltage = this.powerOn ? this.sourceVoltage : 0;
    this.elapsed = 0;
  }

  // ---------------------------------------------------------------------
  // Core RL math
  // ---------------------------------------------------------------------

  /**
   * Recomputes every derived quantity for elapsed simulated time `t`
   * (seconds since the last transition), using the standard first-order
   * RL step response:
   *
   *   i(t) = I_final + (I0 - I_final) * e^(-t / tau)
   *
   * where I_final = V/R while powered, or 0 while unpowered (free decay),
   * and tau = L_eq / R.
   */
  private recompute(t: number): void {
    const R = this.loadResistance;
    const L1 = this.inductorL1;
    const L2 = this.inductorL2;
    const L3 = this.inductorL3;

    this.lEq = L1 + L2 + L3; // mH
    const lEqHenries = this.lEq / 1000;
    this.timeConstant = R > 0 ? this.lEq / R : 0; // ms, since mH/ohm = ms

    this.appliedVoltage = this.powerOn ? this.sourceVoltage : 0;
    const iFinal = R > 0 ? this.appliedVoltage / R : 0;

    const tauSeconds = this.timeConstant / 1000;
    const expTerm = tauSeconds > 0 ? Math.exp(-t / tauSeconds) : 0;
    this.current = iFinal + (this.i0 - iFinal) * expTerm;

    // Guard against floating noise near zero so the UI reads a clean 0.00
    if (Math.abs(this.current) < 0.0005) {
      this.current = 0;
    }

    // V_L(t) via KVL around the loop: V_applied = i*R + V_L  =>  V_L = V_applied - i*R.
    // (Equivalent to the analytic L_eq * di/dt form, but this is the version
    // shown in the reference simulator's formula panel.)
    this.totalInductorVoltage = this.appliedVoltage - this.current * R;

    const safeLEq = this.lEq > 0 ? this.lEq : 1;
    this.voltageL1 = this.totalInductorVoltage * (L1 / safeLEq);
    this.voltageL2 = this.totalInductorVoltage * (L2 / safeLEq);
    this.voltageL3 = this.totalInductorVoltage * (L3 / safeLEq);

    // Stored energy E = 1/2 * L * I^2, displayed in mJ (L in H, I in A -> Joules; *1000 -> mJ)
    this.storedEnergy = 0.5 * lEqHenries * this.current * this.current * 1000;

    // Max energy achievable at steady state with current settings, used only
    // to normalize the progress bar fill (0-100%).
    const iMaxSteady = R > 0 ? this.sourceVoltage / R : 0;
    const maxEnergy = 0.5 * lEqHenries * iMaxSteady * iMaxSteady * 1000;
    this.energyPercent = maxEnergy > 0
      ? Math.min(100, Math.max(0, (this.storedEnergy / maxEnergy) * 100))
      : 0;

    // Phase badge: charging while current is rising toward a higher target,
    // discharging while falling toward zero/lower target, steady once close.
    const delta = iFinal - this.current;
    if (Math.abs(delta) < Math.max(0.005, iFinal * 0.02)) {
      this.energyPhase = 'Steady';
    } else if (!this.powerOn || iFinal < this.current) {
      this.energyPhase = 'Discharging';
    } else {
      this.energyPhase = 'Charging';
    }

    this.remainingEnergyLabel = `${this.storedEnergy.toFixed(1)} mJ`;
    this.phaseTimeLabel = `${(t * 1000).toFixed(2)} ms`;

    this.buildFormulaStrings(R, L1, L2, L3, iFinal, t, tauSeconds);
  }

  /** Builds the live "equation with numbers plugged in" strings shown in the results table. */
  private buildFormulaStrings(
    R: number,
    L1: number,
    L2: number,
    L3: number,
    iFinal: number,
    t: number,
    tauSeconds: number
  ): void {
    this.lEqFormula = `${L1.toFixed(0)} + ${L2.toFixed(0)} + ${L3.toFixed(0)}`;
    this.timeConstantFormula = `${this.lEq.toFixed(1)}mH / ${R.toFixed(1)}ohm`;

    // Build the "I_final + (I0 - I_final)e^-k" style string, where k is the
    // present decay-rate*t product (1/tau * t) shown for this exact instant.
    const ratePerSec = tauSeconds > 0 ? (1 / tauSeconds) : 0;
    const k = ratePerSec * t;
    this.currentFormula = `${iFinal.toFixed(2)}A + (${this.i0.toFixed(2)}A - ${iFinal.toFixed(2)}A)e^-${k.toFixed(2)}`;

    if (this.powerOn) {
      this.totalVoltageFormula = `${this.sourceVoltage.toFixed(1)}V - iR`;
    } else {
      this.totalVoltageFormula = `-iR discharge`;
    }

    const safeLEq = this.lEq > 0 ? this.lEq : 1;
    this.voltageL1Formula = `${this.totalInductorVoltage.toFixed(2)}V x ${L1.toFixed(0)}/${safeLEq.toFixed(0)}`;
    this.voltageL2Formula = `${this.totalInductorVoltage.toFixed(2)}V x ${L2.toFixed(0)}/${safeLEq.toFixed(0)}`;
    this.voltageL3Formula = `${this.totalInductorVoltage.toFixed(2)}V x ${L3.toFixed(0)}/${safeLEq.toFixed(0)}`;

    const lEqHenries = this.lEq / 1000;
    this.storedEnergyFormula = `0.5 x ${lEqHenries.toFixed(3)}H x ${this.current.toFixed(2)}A^2`;
  }

  // ---------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------

  /** Bulb brightness 0..1, proportional to current relative to a practical max (~1A) for strong visual range. */
  get bulbBrightness(): number {
    const reference = 1.0; // amps that map to "fully bright"
    return Math.min(1, Math.abs(this.current) / reference);
  }

  /** Inline glow opacity/blur driven by brightness, used for the bulb's halo. */
  get bulbGlowOpacity(): number {
    return 0.15 + this.bulbBrightness * 0.85;
  }

  get bulbGlowRadius(): number {
    return 8 + this.bulbBrightness * 26;
  }

  /**
   * Interpolates the bulb glass color from a dim, unlit brass tone to a
   * bright glowing yellow as brightness rises, so the glass always reads as
   * a solid lit bulb rather than letting the dark board show through it.
   */
  get bulbFillColor(): string {
    const b = this.bulbBrightness;
    // Dim (off): muted brass #5a5340. Bright (on): vivid yellow #ffd766.
    const from = { r: 0x5a, g: 0x53, b: 0x40 };
    const to = { r: 0xff, g: 0xd7, b: 0x66 };
    const lerp = (a: number, c: number) => Math.round(a + (c - a) * b);
    return `rgb(${lerp(from.r, to.r)}, ${lerp(from.g, to.g)}, ${lerp(from.b, to.b)})`;
  }

  /** Helper the template uses to know whether inductor coils should show the active green halo. */
  get coilsActive(): boolean {
    return Math.abs(this.current) > 0.003;
  }

  /** Returns the array of particle offset fractions (0-1) along the path for *ngFor. */
  get particleOffsets(): number[] {
    const offsets: number[] = [];
    for (let i = 0; i < this.particleCount; i++) {
      offsets.push((this.particlePhase + i / this.particleCount) % 1);
    }
    return offsets;
  }

  /** Formats a plain number with a fixed number of decimals for template binding. */
  fmt(value: number, decimals = 2): string {
    return value.toFixed(decimals);
  }

  get sourceVoltageLabel(): string {
    return `${this.sourceVoltage.toFixed(1)}V`;
  }

  get switchLabel(): string {
    return this.powerOn ? 'ON' : 'OFF';
  }

  get powerButtonLabel(): string {
    return this.powerOn ? 'Power ON' : 'Power OFF';
  }

  get descriptionText(): string {
    return this.powerOn
      ? 'One current path means one current and one bulb brightness.'
      : 'After switch-off the stored magnetic energy keeps the bulb alive briefly, then the loop fully drains.';
  }
}