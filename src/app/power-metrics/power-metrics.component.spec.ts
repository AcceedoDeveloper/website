import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerMetricsComponent } from './power-metrics.component';

describe('PowerMetricsComponent', () => {
  let component: PowerMetricsComponent;
  let fixture: ComponentFixture<PowerMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PowerMetricsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PowerMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
