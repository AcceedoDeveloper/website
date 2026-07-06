import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParallelInductorComponent } from './parallel-inductor.component';

describe('ParallelInductorComponent', () => {
  let component: ParallelInductorComponent;
  let fixture: ComponentFixture<ParallelInductorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParallelInductorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParallelInductorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
