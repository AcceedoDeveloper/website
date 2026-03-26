import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeltingSoftwareComponent } from './melting-software.component';

describe('MeltingSoftwareComponent', () => {
  let component: MeltingSoftwareComponent;
  let fixture: ComponentFixture<MeltingSoftwareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MeltingSoftwareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeltingSoftwareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
