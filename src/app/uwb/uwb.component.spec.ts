import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UwbComponent } from './uwb.component';

describe('UwbComponent', () => {
  let component: UwbComponent;
  let fixture: ComponentFixture<UwbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UwbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UwbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
