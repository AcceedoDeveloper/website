import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoledialogComponent } from './roledialog.component';

describe('RoledialogComponent', () => {
  let component: RoledialogComponent;
  let fixture: ComponentFixture<RoledialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoledialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoledialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
