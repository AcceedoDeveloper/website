import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParallelBranchSimulatorComponent } from './parallel-branch-simulator.component';

describe('ParallelBranchSimulatorComponent', () => {
  let component: ParallelBranchSimulatorComponent;
  let fixture: ComponentFixture<ParallelBranchSimulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParallelBranchSimulatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParallelBranchSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
