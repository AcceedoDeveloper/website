import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dwincontant4Component } from './dwincontant4.component';

describe('Dwincontant4Component', () => {
  let component: Dwincontant4Component;
  let fixture: ComponentFixture<Dwincontant4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dwincontant4Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dwincontant4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
