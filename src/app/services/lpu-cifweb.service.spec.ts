import { TestBed } from '@angular/core/testing';

import { LpuCIFWebService } from './lpu-cifweb.service';

describe('LpuCIFWebService', () => {
  let service: LpuCIFWebService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LpuCIFWebService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
