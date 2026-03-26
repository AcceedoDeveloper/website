import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Product7Component } from './product7.component';

describe('Product7Component', () => {
  let component: Product7Component;
  let fixture: ComponentFixture<Product7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Product7Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Product7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
