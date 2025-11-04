import { TestBed } from '@angular/core/testing';

import { CohortcommonService } from './cohortcommon.service';

describe('CohortcommonService', () => {
  let service: CohortcommonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CohortcommonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
