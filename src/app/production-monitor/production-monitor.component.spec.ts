import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductionMonitorComponent } from './production-monitor.component';

describe('ProductionMonitorComponent', () => {
  let component: ProductionMonitorComponent;
  let fixture: ComponentFixture<ProductionMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductionMonitorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductionMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
