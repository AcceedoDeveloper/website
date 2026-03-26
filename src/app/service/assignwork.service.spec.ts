import { TestBed } from '@angular/core/testing';

import { AssignworkService } from './assignwork.service';

describe('AssignworkService', () => {
  let service: AssignworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssignworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
