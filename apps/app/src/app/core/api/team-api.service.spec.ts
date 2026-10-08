import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';
import {
  RejectionRequest,
  TeamMemberList,
  VacationRequestDetail,
  VacationRequestList,
} from '@api-types';
import { TeamApiService } from './team-api.service';

describe('TeamApiService', () => {
  let service: TeamApiService;
  let httpMock: HttpTestingController;

  const detail: VacationRequestDetail = {
    request_id: 'abc',
    employee_name: 'Ana Pérez',
    start_date: '2026-11-02',
    end_date: '2026-11-06',
    reason: 'Viaje',
    status: 'Pendiente',
    created_at: '2026-10-08T10:00:00Z',
    resolution_date: null,
    manager_notes: null,
  };

  const list: VacationRequestList = {
    items: [
      {
        request_id: 'abc',
        employee_name: 'Ana Pérez',
        start_date: '2026-11-02',
        end_date: '2026-11-06',
        status: 'Pendiente',
        created_at: '2026-10-08T10:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    size: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    service = TestBed.inject(TeamApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('EP-011 getMyTeam: GET /api/profile/my-team y devuelve TeamMemberList', () => {
    const team: TeamMemberList = {
      items: [{ employee_id: 'e1', full_name: 'Ana Pérez', email: 'ana@example.com' }],
    };
    let result: TeamMemberList | undefined;

    service.getMyTeam().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/profile/my-team');
    expect(req.request.method).toBe('GET');
    req.flush(team);

    expect(result).toEqual(team);
  });

  it('EP-017 getTeamRequests: GET /api/team/vacation-requests?page=1&size=20 por defecto', () => {
    let result: VacationRequestList | undefined;

    service.getTeamRequests().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/team/vacation-requests?page=1&size=20');
    expect(req.request.method).toBe('GET');
    req.flush(list);

    expect(result).toEqual(list);
  });

  it('EP-017 getTeamRequests: propaga page y size explícitos en la query', () => {
    service.getTeamRequests(2, 10).subscribe();

    const req = httpMock.expectOne('/api/team/vacation-requests?page=2&size=10');
    expect(req.request.method).toBe('GET');
    req.flush({ ...list, page: 2, size: 10 });
  });

  it('EP-018 getTeamRequest: GET /api/team/vacation-requests/abc y devuelve VacationRequestDetail', () => {
    let result: VacationRequestDetail | undefined;

    service.getTeamRequest('abc').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/team/vacation-requests/abc');
    expect(req.request.method).toBe('GET');
    req.flush(detail);

    expect(result).toEqual(detail);
  });

  it('EP-019 approve: POST /api/team/vacation-requests/abc/approve y devuelve VacationRequestDetail', () => {
    const approved: VacationRequestDetail = {
      ...detail,
      status: 'Aprobada',
      resolution_date: '2026-10-09',
    };
    let result: VacationRequestDetail | undefined;

    service.approve('abc').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/team/vacation-requests/abc/approve');
    expect(req.request.method).toBe('POST');
    req.flush(approved);

    expect(result).toEqual(approved);
  });

  it('EP-020 reject: POST /api/team/vacation-requests/abc/reject con body {rejection_reason}', () => {
    const body: RejectionRequest = { rejection_reason: 'Coincide con cierre de proyecto' };
    const rejected: VacationRequestDetail = {
      ...detail,
      status: 'Rechazada',
      resolution_date: '2026-10-09',
      manager_notes: 'Coincide con cierre de proyecto',
    };
    let result: VacationRequestDetail | undefined;

    service.reject('abc', body).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/team/vacation-requests/abc/reject');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rejection_reason: 'Coincide con cierre de proyecto' });
    req.flush(rejected);

    expect(result).toEqual(rejected);
  });

  it('EP-020 reject: acepta body sin rejection_reason (campo opcional)', () => {
    service.reject('abc', {}).subscribe();

    const req = httpMock.expectOne('/api/team/vacation-requests/abc/reject');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ ...detail, status: 'Rechazada' });
  });

  it('error HTTP: propaga el status al suscriptor (approve 403)', () => {
    let status: number | undefined;

    service.approve('abc').subscribe({
      next: () => {
        throw new Error('no debería emitir');
      },
      error: (err: { status: number }) => (status = err.status),
    });

    const req = httpMock.expectOne('/api/team/vacation-requests/abc/approve');
    req.flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(status).toBe(403);
  });
});
