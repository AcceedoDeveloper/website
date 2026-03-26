import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularDeveloperComponent } from './angular-developer.component';

describe('AngularDeveloperComponent', () => {
  let component: AngularDeveloperComponent;
  let fixture: ComponentFixture<AngularDeveloperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AngularDeveloperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AngularDeveloperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
