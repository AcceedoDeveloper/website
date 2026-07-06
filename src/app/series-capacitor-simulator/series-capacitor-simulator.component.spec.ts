import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeriesCapacitorSimulatorComponent } from './series-capacitor-simulator.component';

describe('SeriesCapacitorSimulatorComponent', () => {
  let component: SeriesCapacitorSimulatorComponent;
  let fixture: ComponentFixture<SeriesCapacitorSimulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SeriesCapacitorSimulatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeriesCapacitorSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
