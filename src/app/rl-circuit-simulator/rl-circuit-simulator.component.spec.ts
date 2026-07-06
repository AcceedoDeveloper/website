import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RlCircuitSimulatorComponent } from './rl-circuit-simulator.component';

describe('RlCircuitSimulatorComponent', () => {
  let component: RlCircuitSimulatorComponent;
  let fixture: ComponentFixture<RlCircuitSimulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RlCircuitSimulatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RlCircuitSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
