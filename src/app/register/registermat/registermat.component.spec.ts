import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistermatComponent } from './registermat.component';

describe('RegistermatComponent', () => {
  let component: RegistermatComponent;
  let fixture: ComponentFixture<RegistermatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistermatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistermatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
