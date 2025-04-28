import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartAttendanceComponent } from './smart-attendance.component';

describe('SmartAttendanceComponent', () => {
  let component: SmartAttendanceComponent;
  let fixture: ComponentFixture<SmartAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SmartAttendanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
