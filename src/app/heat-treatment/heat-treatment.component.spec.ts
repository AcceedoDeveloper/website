import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeatTreatmentComponent } from './heat-treatment.component';

describe('HeatTreatmentComponent', () => {
  let component: HeatTreatmentComponent;
  let fixture: ComponentFixture<HeatTreatmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeatTreatmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeatTreatmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
