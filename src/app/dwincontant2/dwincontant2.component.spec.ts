import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dwincontant2Component } from './dwincontant2.component';

describe('Dwincontant2Component', () => {
  let component: Dwincontant2Component;
  let fixture: ComponentFixture<Dwincontant2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dwincontant2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dwincontant2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
