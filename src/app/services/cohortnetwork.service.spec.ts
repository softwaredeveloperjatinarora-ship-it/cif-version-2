import { TestBed } from '@angular/core/testing';

import { CohortnetworkService } from './cohortnetwork.service';

describe('CohortnetworkService', () => {
  let service: CohortnetworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CohortnetworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
