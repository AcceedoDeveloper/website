import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResistanceSimulatorComponent } from './resistance-simulator.component';

describe('ResistanceSimulatorComponent', () => {
  let component: ResistanceSimulatorComponent;
  let fixture: ComponentFixture<ResistanceSimulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResistanceSimulatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResistanceSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
