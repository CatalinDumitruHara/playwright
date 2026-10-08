import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';
import { UserProfile } from '@api-types';
import { ProfileApiService } from './profile-api.service';

describe('ProfileApiService', () => {
  let service: ProfileApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    service = TestBed.inject(ProfileApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('EP-010 getMe: GET /api/profile/me, devuelve UserProfile', () => {
    const body: UserProfile = {
      user_id: 'u1',
      full_name: 'Ana Pérez',
      email: 'ana@test.com',
      user_role: 'EMPLEADO',
      manager_name: 'Marta Ruiz',
    };
    let result: UserProfile | undefined;

    service.getMe().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/profile/me');
    expect(req.request.method).toBe('GET');
    expect(req.request.body).toBeNull();
    req.flush(body);

    expect(result).toEqual(body);
  });

  it('propaga el error HTTP al suscriptor (401 en getMe)', () => {
    let status: number | undefined;
    let emitted = false;

    service.getMe().subscribe({
      next: () => (emitted = true),
      error: (e: { status: number }) => (status = e.status),
    });

    httpMock
      .expectOne('/api/profile/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(emitted).toBe(false);
    expect(status).toBe(401);
  });
});
