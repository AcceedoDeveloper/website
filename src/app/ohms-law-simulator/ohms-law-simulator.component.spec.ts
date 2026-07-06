import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OhmsLawSimulatorComponent } from './ohms-law-simulator.component';

describe('OhmsLawSimulatorComponent', () => {
  let component: OhmsLawSimulatorComponent;
  let fixture: ComponentFixture<OhmsLawSimulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OhmsLawSimulatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OhmsLawSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
