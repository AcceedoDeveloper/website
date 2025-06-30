import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dwincontant5Component } from './dwincontant5.component';

describe('Dwincontant5Component', () => {
  let component: Dwincontant5Component;
  let fixture: ComponentFixture<Dwincontant5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dwincontant5Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dwincontant5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
