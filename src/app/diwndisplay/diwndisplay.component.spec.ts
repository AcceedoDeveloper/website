import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiwndisplayComponent } from './diwndisplay.component';

describe('DiwndisplayComponent', () => {
  let component: DiwndisplayComponent;
  let fixture: ComponentFixture<DiwndisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiwndisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiwndisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
