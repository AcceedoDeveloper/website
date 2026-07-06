import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-diode-bias-simulator',
  templateUrl: './diode-bias-simulator.component.html',
  styleUrls: ['./diode-bias-simulator.component.css']
})
export class DiodeBiasSimulatorComponent implements OnInit {
  
  voltage: number = 9.0;
  isForwardBias: boolean = true;
  loadResistance: number = 10;

  current: number = 0;
  animationDuration: string = '0s';
  
  // Dynamic text properties
  diodeBiasLabel: string = 'FORWARD BIASED';
  toggleText: string = 'Forward Bias (ON)';
  toggleColorClass: string = 'c-green';
  
  mathStateDesc: string = 'Anode (+) to Cathode (-) Connection';
  mathBiasStatus: string = 'FORWARD BIAS';
  mathBiasClass: string = 'c-green';
  mathResEquation: string = 'Forward Conducting Switch State';
  mathResVal: string = '0 Ω (Closed Switch)';
  mathResClass: string = 'c-blue';
  mathCurrCalc: string = '9.0V / 10Ω Load';
  mathCurrValClass: string = 'c-green';
  
  // Graphical Polarity Signs
  diodeLeftSign: string = '+';
  diodeRightSign: string = '-';
  batteryPolarity: string = 'forward'; // 'forward' or 'reverse'

  constructor() {}

  ngOnInit(): void {
    this.updateCircuit();
  }

  onVoltageChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.voltage = parseFloat(target.value);
    this.updateCircuit();
  }

  toggleBias(): void {
    this.isForwardBias = !this.isForwardBias;
    this.updateCircuit();
  }

  private updateCircuit(): void {
    if (this.isForwardBias) {
      // --- FORWARD BIAS LOGIC ---
      this.batteryPolarity = 'forward';
      this.diodeLeftSign = '+';
      this.diodeRightSign = '-';
      this.diodeBiasLabel = 'FORWARD BIASED';
      this.toggleText = 'Forward Bias (ON)';
      this.toggleColorClass = 'c-green';

      this.mathStateDesc = 'Anode (+) to Cathode (-) Connection';
      this.mathBiasStatus = 'FORWARD BIAS';
      this.mathBiasClass = 'c-green';
      this.mathResEquation = 'Forward Conducting Switch State';
      this.mathResVal = '0 Ω (Closed Switch)';
      this.mathResClass = 'c-blue';

      const I = this.voltage / this.loadResistance;
      this.current = I;
      this.mathCurrCalc = `${this.voltage.toFixed(1)}V / ${this.loadResistance}Ω Load`;
      this.mathCurrValClass = 'c-green';

      // Speed up electrons based on current
      const duration = Math.max(0.4, 2.0 / I);
      this.animationDuration = duration + 's';

    } else {
      // --- REVERSE BIAS LOGIC ---
      this.batteryPolarity = 'reverse';
      this.diodeLeftSign = '-';
      this.diodeRightSign = '+';
      this.diodeBiasLabel = 'REVERSE BIASED';
      this.toggleText = 'Reverse Bias (BLOCKED)';
      this.toggleColorClass = 'c-red';

      this.mathStateDesc = 'Cathode (-) to Anode (+) Connection';
      this.mathBiasStatus = 'REVERSE BIAS';
      this.mathBiasClass = 'c-red';
      this.mathResEquation = 'Reverse Non-Conducting Block State';
      this.mathResVal = '∞ MΩ (Open Switch)';
      this.mathResClass = 'c-red';

      this.current = 0;
      this.mathCurrCalc = `0V / ${this.loadResistance}Ω Load`;
      this.mathCurrValClass = 'c-red';

      // Stop electrons
      this.animationDuration = '0s';
    }
  }
}