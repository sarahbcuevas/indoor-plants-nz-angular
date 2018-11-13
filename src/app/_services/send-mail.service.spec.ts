import { TestBed, inject } from '@angular/core/testing';

import { SendMailService } from './send-mail.service';

describe('SendMailService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SendMailService]
    });
  });

  it('should be created', inject([SendMailService], (service: SendMailService) => {
    expect(service).toBeTruthy();
  }));
});
