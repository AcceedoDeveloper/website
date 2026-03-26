import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dwincontant6Component } from './dwincontant6.component';

describe('Dwincontant6Component', () => {
  let component: Dwincontant6Component;
  let fixture: ComponentFixture<Dwincontant6Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dwincontant6Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dwincontant6Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
