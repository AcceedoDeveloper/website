import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutasComponent } from './aboutas.component';

describe('AboutasComponent', () => {
  let component: AboutasComponent;
  let fixture: ComponentFixture<AboutasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AboutasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
