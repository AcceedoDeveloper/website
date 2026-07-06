import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Discrete states the circuit can be in. Used to drive the
 * "Circuit Operating State" readout and the wire / dot animations.
 */
type CircuitState = 'CHARGING' | 'DISCHARGING' | 'STEADY';

/**
 * Strongly typed snapshot of every derived electrical quantity the
 * template needs to render on a given animation frame.
 */
interface CircuitReadings {
  /** Supply / source voltage in Volts (fixed at 12V, exposed for future extensibility). */
  sourceVoltage: number;
  /** Instantaneous voltage across the capacitor plates (Vc) in Volts. */
  capacitorVoltage: number;
  /** Instantaneous stored charge Q = C * Vc, in microcoulombs (µC). */
  chargeMicroCoulombs: number;
  /** Percentage of full charge reached (0 - 100). */
  chargePercent: number;
  /** Current flowing through the bulb / load branch, in Amps. */
  loadCurrent: number;
  /** Resistance of the bulb load, in Ohms. */
  resistance: number;
  /** Capacitance value, in microfarads (µF). */
  capacitance: number;
  /** Power dissipated in the load, in Watts (P = V * I). */
  power: number;
}

@Component({
  selector: 'app-capacitor-filter-simulator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './capacitor-filter-simulator.component.html',
  styleUrls: ['./capacitor-filter-simulator.component.css']
})
export class CapacitorFilterSimulatorComponent implements OnInit, OnDestroy {

  // ---------------------------------------------------------------------
  // ----------------------  CIRCUIT CONSTANTS  -------------------------
  // ---------------------------------------------------------------------

  /** Fixed DC supply voltage shown on the battery (matches reference: 12.0V). */
  readonly sourceVoltage = 12.0;

  /** Bulb / load resistance in Ohms. Used for the on-screen Ohm's Law readout. */
  readonly resistance = 10;

  /** Capacitance of the filter capacitor, in microfarads. Used for the Q = C * Vc readout. */
  readonly capacitance = 20;

  /**
   * Real RC circuits with these component values would charge in
   * microseconds - far too fast to watch. The reference recording
   * visibly stretches this out (roughly 33s to fully charge, roughly
   * 7s to fully discharge through the bulb) for teaching purposes.
   * These are the *animation* time-constants (in seconds) that
   * reproduce that pacing; they intentionally do not derive from
   * resistance/capacitance directly, exactly like the reference does.
   */
  private readonly chargeTimeConstantSeconds = 15;
  private readonly dischargeTimeConstantSeconds = 5;

  /** Simulation tick length in milliseconds (drives the smoothness of all animations). */
  private readonly tickMs = 50;

  /**
   * Voltage threshold (as a fraction of source voltage) below which the
   * capacitor is considered "fully charged" / "fully discharged" and the
   * state flips to STEADY. 0.002 = within 0.2% of the target, reached
   * after roughly 6 time-constants - close enough to 100%/0% for the
   * rounded percentage display while keeping the simulation responsive.
   */
  private readonly steadyStateThresholdRatio = 0.002;

  // ---------------------------------------------------------------------
  // ----------------------  MUTABLE SIMULATION STATE  -------------------
  // ---------------------------------------------------------------------

  /** Whether the DC power switch is currently ON (battery connected). */
  isPowerOn = true;

  /** Present operating state used to color / label the info panel. */
  circuitState: CircuitState = 'CHARGING';

  /** Instantaneous capacitor voltage (Volts). Starts at 0 on init / reset. */
  private capacitorVoltage = 0;

  /** Live derived readings consumed directly by the template. */
  readings: CircuitReadings = this.computeReadings();

  /** Handle for the running animation interval, so it can be cleared on destroy. */
  private simulationHandle: ReturnType<typeof setInterval> | null = null;

  /**
   * Drives the orbiting current-flow dots. A continuously increasing
   * angle (0 - 360) representing how far each indicator dot has
   * travelled around the rectangular wire loop.
   */
  flowAngle = 0;

  /** Degrees travelled by the flow dots per simulation tick, recalculated from live current. */
  private readonly maxFlowSpeedDegPerTick = 6;

  // ---------------------------------------------------------------------
  // ----------------------------  LIFECYCLE  -----------------------------
  // ---------------------------------------------------------------------

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.startSimulationLoop();
  }

  ngOnDestroy(): void {
    this.stopSimulationLoop();
  }

  // ---------------------------------------------------------------------
  // ----------------------------  CONTROLS  ------------------------------
  // ---------------------------------------------------------------------

  /**
   * Handles the DC Power Switch toggle. Connecting the battery resumes
   * charging the capacitor toward the source voltage; disconnecting it
   * lets the capacitor discharge back through the bulb load.
   */
  togglePower(): void {
    this.isPowerOn = !this.isPowerOn;
  }

  /**
   * Resets the entire simulator back to its initial, powered-on,
   * fully-discharged state - mirroring a fresh page load.
   */
  reset(): void {
    this.isPowerOn = true;
    this.capacitorVoltage = 0;
    this.flowAngle = 0;
    this.circuitState = 'CHARGING';
    this.readings = this.computeReadings();
  }

  // ---------------------------------------------------------------------
  // -------------------------  SIMULATION LOOP  --------------------------
  // ---------------------------------------------------------------------

  private startSimulationLoop(): void {
    this.simulationHandle = setInterval(() => this.step(), this.tickMs);
  }

  private stopSimulationLoop(): void {
    if (this.simulationHandle !== null) {
      clearInterval(this.simulationHandle);
      this.simulationHandle = null;
    }
  }

  /**
   * Advances the RC circuit simulation by one fixed time-step using the
   * analytic exponential charge / discharge solution (stable regardless
   * of frame-rate, unlike naive Euler integration).
   *
   *   Charging:    Vc(t) = Vs + (Vc0 - Vs) * e^(-dt / RC)
   *   Discharging: Vc(t) = Vc0 * e^(-dt / RC)
   */
  private step(): void {
    const dtSeconds = this.tickMs / 1000;

    if (this.isPowerOn) {
      // Battery connected: charge toward source voltage using the
      // charge-side animation time-constant.
      const tau = this.chargeTimeConstantSeconds;
      const target = this.sourceVoltage;
      this.capacitorVoltage =
        target + (this.capacitorVoltage - target) * Math.exp(-dtSeconds / tau);

      const remainingRatio = (target - this.capacitorVoltage) / target;
      if (remainingRatio <= this.steadyStateThresholdRatio) {
        this.capacitorVoltage = target;
        this.circuitState = 'STEADY';
      } else {
        this.circuitState = 'CHARGING';
      }
    } else {
      // Battery disconnected: capacitor discharges through the bulb
      // using the (shorter) discharge-side animation time-constant.
      const tau = this.dischargeTimeConstantSeconds;
      this.capacitorVoltage = this.capacitorVoltage * Math.exp(-dtSeconds / tau);

      const remainingRatio = this.capacitorVoltage / this.sourceVoltage;
      if (remainingRatio <= this.steadyStateThresholdRatio) {
        this.capacitorVoltage = 0;
        this.circuitState = 'STEADY';
      } else {
        this.circuitState = 'DISCHARGING';
      }
    }

    this.readings = this.computeReadings();
    this.advanceFlowAnimation();
    this.cdr.markForCheck();
  }

  /**
   * Moves the orbiting current-indicator dots. Speed scales with the
   * present load current so the dots visibly slow down as the
   * capacitor approaches full charge / full discharge, and stop
   * completely once steady state is reached.
   */
  private advanceFlowAnimation(): void {
    const referenceCurrent = this.sourceVoltage / this.resistance;
    const normalizedSpeed = Math.min(
      1,
      Math.abs(this.readings.loadCurrent) / referenceCurrent
    );
    const step = this.maxFlowSpeedDegPerTick * normalizedSpeed;
    this.flowAngle = (this.flowAngle + step) % 360;
  }

  // ---------------------------------------------------------------------
  // ---------------------------  CALCULATIONS  ----------------------------
  // ---------------------------------------------------------------------

  /**
   * Derives every display-ready electrical quantity from the current
   * capacitor voltage, applying Ohm's Law (V = I * R) and the power
   * law (P = V * I) for the load branch.
   */
  private computeReadings(): CircuitReadings {
    const vc = this.capacitorVoltage;
    const chargeCoulombs = (this.capacitance * vc) / 1_000_000; // Q = C * Vc
    const chargeMicroCoulombs = chargeCoulombs * 1_000_000;
    const chargePercent = (vc / this.sourceVoltage) * 100;

    // Load current: while charging, the bulb is driven by the battery
    // (effectively at source voltage once wiring settles); while
    // discharging, the capacitor itself drives the bulb at Vc / R.
    const loadCurrent = this.isPowerOn
      ? this.sourceVoltage / this.resistance
      : vc / this.resistance;

    const power = (this.isPowerOn ? this.sourceVoltage : vc) * loadCurrent;

    return {
      sourceVoltage: this.sourceVoltage,
      capacitorVoltage: vc,
      chargeMicroCoulombs,
      chargePercent: Math.max(0, Math.min(100, chargePercent)),
      loadCurrent,
      resistance: this.resistance,
      capacitance: this.capacitance,
      power
    };
  }

  // ---------------------------------------------------------------------
  // ----------------------------  TEMPLATE HELPERS  -----------------------
  // ---------------------------------------------------------------------

  /** Human-readable description shown next to the operating-state label. */
  get circuitStateDescription(): string {
    switch (this.circuitState) {
      case 'CHARGING':
        return 'Normal parallel supply operation';
      case 'DISCHARGING':
        return 'Battery removed - capacitor feeds the load';
      case 'STEADY':
        return this.isPowerOn
          ? 'Capacitor fully charged - holding voltage'
          : 'Capacitor fully discharged - circuit at rest';
    }
  }

  /** Bulb brightness as a 0-1 ratio, used to drive glow intensity bindings. */
  get bulbBrightness(): number {
    const ratio = this.isPowerOn
      ? 1
      : this.readings.chargePercent / 100;
    return Math.max(0, Math.min(1, ratio));
  }

  /** Visual intensity (0-1) of the capacitor plate glow, based on stored charge. */
  get capacitorGlow(): number {
    return Math.max(0, Math.min(1, this.readings.chargePercent / 100));
  }

  /** Whether current indicator dots on the battery-side wires should animate. */
  get isBatterySideFlowing(): boolean {
    return this.isPowerOn && this.circuitState !== 'STEADY';
  }

  /** Whether current indicator dots on the bulb-side wires should animate. */
  get isLoadSideFlowing(): boolean {
    return this.circuitState !== 'STEADY';
  }

  /** Rounded percentage for the charge progress bar label. */
  get chargePercentRounded(): number {
    return Math.round(this.readings.chargePercent);
  }

  // ---------------------------------------------------------------------
  // ------------------  ORBITING DOT POSITION HELPERS  --------------------
  // ---------------------------------------------------------------------
  //
  // The reference circuit shows small dots travelling clockwise around
  // the rectangular wire loop: a yellow pair and a blue pair, each
  // pair offset 180 degrees apart, with the blue pair additionally
  // offset a quarter-loop ahead of the yellow pair so all four dots
  // stay evenly spaced as they orbit together. The loop is
  // parameterized as a perimeter walk over the four straight segments
  // of the SVG wire rectangle (matching the coordinates drawn in the
  // template).

  /** Perimeter path points walked clockwise, starting at the top-left corner. */
  private readonly loopCorners = [
    { x: 95, y: 40 },   // top-left
    { x: 545, y: 40 },  // top-right
    { x: 545, y: 230 }, // bottom-right
    { x: 95, y: 230 },  // bottom-left
  ];

  /** Total perimeter length of the rectangular wire loop, in SVG units. */
  private get loopPerimeter(): number {
    let total = 0;
    for (let i = 0; i < this.loopCorners.length; i++) {
      const a = this.loopCorners[i];
      const b = this.loopCorners[(i + 1) % this.loopCorners.length];
      total += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return total;
  }

  /**
   * Walks `distance` units clockwise around the rectangular loop
   * starting from the top-left corner, wrapping around as needed, and
   * returns the resulting point.
   */
  private pointAtDistance(distance: number): { x: number; y: number } {
    const perimeter = this.loopPerimeter;
    let remaining = ((distance % perimeter) + perimeter) % perimeter;

    for (let i = 0; i < this.loopCorners.length; i++) {
      const a = this.loopCorners[i];
      const b = this.loopCorners[(i + 1) % this.loopCorners.length];
      const segmentLength = Math.hypot(b.x - a.x, b.y - a.y);

      if (remaining <= segmentLength) {
        const t = segmentLength === 0 ? 0 : remaining / segmentLength;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      remaining -= segmentLength;
    }
    return this.loopCorners[0];
  }

  /** Converts the current flow angle (0-360) into a perimeter distance. */
  private get flowDistance(): number {
    return (this.flowAngle / 360) * this.loopPerimeter;
  }

  /** Yellow battery-side dot riding the top wire. */
  get batteryDotTop(): { x: number; y: number } {
    return this.pointAtDistance(this.flowDistance);
  }

  /** Yellow battery-side dot riding the bottom wire (offset halfway around the loop). */
  get batteryDotBottom(): { x: number; y: number } {
    return this.pointAtDistance(this.flowDistance + this.loopPerimeter / 2);
  }

  /** Blue load-side dot riding the top wire, offset a quarter loop ahead of the battery dot. */
  get loadDotTop(): { x: number; y: number } {
    return this.pointAtDistance(this.flowDistance + this.loopPerimeter / 4);
  }

  /** Blue load-side dot riding the bottom wire, offset three-quarters around the loop. */
  get loadDotBottom(): { x: number; y: number } {
    return this.pointAtDistance(this.flowDistance + (3 * this.loopPerimeter) / 4);
  }
}