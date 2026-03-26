import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dwincontant8Component } from './dwincontant8.component';

describe('Dwincontant8Component', () => {
  let component: Dwincontant8Component;
  let fixture: ComponentFixture<Dwincontant8Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dwincontant8Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dwincontant8Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
