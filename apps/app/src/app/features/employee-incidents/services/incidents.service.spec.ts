
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IncidentsService } from './incidents.service';
import { createHttpFactory, HttpMethod } from '@ngneat/spectator/jest';

describe('IncidentsService', () => {
  const { service, controller } = createHttpFactory({
    service: IncidentsService,
    imports: [HttpClientTestingModule],
  })();

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
