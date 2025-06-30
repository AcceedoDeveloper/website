import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dwincontant3Component } from './dwincontant3.component';

describe('Dwincontant3Component', () => {
  let component: Dwincontant3Component;
  let fixture: ComponentFixture<Dwincontant3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dwincontant3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dwincontant3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
