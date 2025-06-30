import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DwincontantComponent } from './dwincontant.component';

describe('DwincontantComponent', () => {
  let component: DwincontantComponent;
  let fixture: ComponentFixture<DwincontantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DwincontantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DwincontantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
