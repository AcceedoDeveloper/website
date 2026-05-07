import { TestBed } from '@angular/core/testing';

import { CreatprojectService } from './creatproject.service';

describe('CreatprojectService', () => {
  let service: CreatprojectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreatprojectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
