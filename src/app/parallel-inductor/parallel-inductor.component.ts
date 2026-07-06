import { Component, OnInit, OnDestroy, ElementRef, AfterViewInit, ViewChild, HostListener } from '@angular/core';

@Component({
  selector: 'app-parallel-inductor',
  templateUrl: './parallel-inductor.component.html',
  styleUrls: ['./parallel-inductor.component.css']
})
export class ParallelInductorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  // UI State
  isOn = true;
  
  // Slider Values
  sourceVoltage = 21;
  loadResistance = 24;
  inductorL1 = 47;
  inductorL2 = 24;
  inductorL3 = 46;

  // Computed Physics Values
  branchCurrents = [0, 0, 0];
  totalCurrent = 0;
  leqMh = 0;
  tauMs = 0;
  energyMj = 0;
  maxEnergyMj = 0;
  phaseTimeMs = 0;
  phaseLabel = 'Steady';
  currentRatios = [0, 0, 0];

  private animationFrameId: number = 0;
  private lastFrameTime: number = 0;
  private readonly VISUAL_TIME_SCALE = 0.004;

  ngOnInit(): void {
    this.calculatePhysics(0);
  }

  ngAfterViewInit(): void {
    this.scaleCircuit();
    this.startAnimation();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.scaleCircuit();
  }

  onTogglePower() {
    this.isOn = !this.isOn;
    this.resetPhase();
  }

  onSliderChange() {
    this.calculatePhysics(0);
  }

  private resetPhase() {
    // Store starting currents for exponential decay formula visualization
    this.phaseTimeMs = 0;
  }

  private calculatePhysics(dt: number) {
    const { sourceVoltage: v, loadResistance: r, inductorL1: l1, inductorL2: l2, inductorL3: l3 } = this;

    // Calculate Equivalent Inductance (Parallel)
    const invL = 1 / l1 + 1 / l2 + 1 / l3;
    const leqMh = 1 / invL;
    const leqH = leqMh / 1000;
    const tau = leqH / r;

    // Calculate Branch Targets
    const branchTargets = this.isOn ? [v / r, v / r, v / r] : [0, 0, 0];
    const branchTaus = [(l1/1000) / r, (l2/1000) / r, (l3/1000) / r];

    // Update Branch Currents using Exponential Discharge/Charge formula
    this.branchCurrents = this.branchCurrents.map((current, index) => {
      const target = branchTargets[index];
      const tauBranch = Math.max(branchTaus[index], 0.000001);
      const next = target + (current - target) * Math.exp(-dt / tauBranch);
      return Math.abs(next) < 0.0005 ? 0 : next;
    });

    // Update Global State
    this.phaseTimeMs += dt * 1000;
    this.totalCurrent = this.branchCurrents[0] + this.branchCurrents[1] + this.branchCurrents[2];
    this.leqMh = leqMh;
    this.tauMs = tau * 1000;

    // Energy Calculations
    const branchH = [(l1/1000), (l2/1000), (l3/1000)];
    this.energyMj = 0.5 * (
      branchH[0] * Math.pow(this.branchCurrents[0], 2) +
      branchH[1] * Math.pow(this.branchCurrents[1], 2) +
      branchH[2] * Math.pow(this.branchCurrents[2], 2)
    ) * 1000;

    const steadyCurrent = v / r;
    this.maxEnergyMj = 0.5 * (branchH[0] + branchH[1] + branchH[2]) * Math.pow(steadyCurrent, 2) * 1000;

    // Phase Label
    const totalTarget = this.isOn ? 3 * steadyCurrent : 0;
    if (this.isOn) {
      this.phaseLabel = this.totalCurrent >= totalTarget * 0.985 ? 'Steady' : 'Charging';
    } else {
      this.phaseLabel = this.totalCurrent > 0.0005 ? 'Discharging' : 'Drained';
    }

    // Visualization Ratios (0 to 1)
    this.currentRatios = this.branchCurrents.map(c => Math.max(0, Math.min(1, c / Math.max(steadyCurrent, 0.001))));
  }

  private startAnimation() {
    const animate = (now: number) => {
      if (!this.lastFrameTime) this.lastFrameTime = now;
      const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000) * this.VISUAL_TIME_SCALE;
      this.lastFrameTime = now;

      this.calculatePhysics(dt);
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private scaleCircuit() {
    const canvas = this.canvasContainer.nativeElement;
    const stage = canvas.querySelector('.circuit-stage');
    if (!stage) return;
    const scale = canvas.clientWidth / 520;
    stage.style.transform = `scale(${scale})`;
  }
}