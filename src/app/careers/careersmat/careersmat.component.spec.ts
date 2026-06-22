import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CareersmatComponent } from './careersmat.component';

describe('CareersmatComponent', () => {
  let component: CareersmatComponent;
  let fixture: ComponentFixture<CareersmatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CareersmatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CareersmatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
