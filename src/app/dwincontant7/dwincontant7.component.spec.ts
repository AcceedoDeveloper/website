import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dwincontant7Component } from './dwincontant7.component';

describe('Dwincontant7Component', () => {
  let component: Dwincontant7Component;
  let fixture: ComponentFixture<Dwincontant7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dwincontant7Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dwincontant7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
