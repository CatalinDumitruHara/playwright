import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';
import {
  VacationRequestCreate,
  VacationRequestDetail,
  VacationRequestList,
} from '@api-types';
import { VacationRequestsApiService } from './vacation-requests-api.service';

describe('VacationRequestsApiService', () => {
  let service: VacationRequestsApiService;
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
    service = TestBed.inject(VacationRequestsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('EP-012 create: POST /api/vacation-requests con el body y devuelve VacationRequestDetail', () => {
    const body: VacationRequestCreate = {
      start_date: '2026-11-02',
      end_date: '2026-11-06',
      reason: 'Viaje',
    };
    let result: VacationRequestDetail | undefined;

    service.create(body).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/vacation-requests');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(detail, { status: 201, statusText: 'Created' });

    expect(result).toEqual(detail);
  });

  it('EP-013 getMyRequests: GET /api/vacation-requests/my-requests?page=1&size=20 por defecto', () => {
    let result: VacationRequestList | undefined;

    service.getMyRequests().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/vacation-requests/my-requests?page=1&size=20');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(list);

    expect(result).toEqual(list);
  });

  it('EP-013 getMyRequests: propaga page y size explícitos en la query', () => {
    service.getMyRequests(3, 5).subscribe();

    const req = httpMock.expectOne('/api/vacation-requests/my-requests?page=3&size=5');
    expect(req.request.method).toBe('GET');
    req.flush({ ...list, page: 3, size: 5 });
  });

  it('EP-014 getById: GET /api/vacation-requests/abc y devuelve VacationRequestDetail', () => {
    let result: VacationRequestDetail | undefined;

    service.getById('abc').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/vacation-requests/abc');
    expect(req.request.method).toBe('GET');
    req.flush(detail);

    expect(result).toEqual(detail);
  });

  it('EP-015 cancel: POST /api/vacation-requests/abc/cancel y devuelve VacationRequestDetail', () => {
    const cancelled: VacationRequestDetail = { ...detail, status: 'Cancelada' };
    let result: VacationRequestDetail | undefined;

    service.cancel('abc').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/vacation-requests/abc/cancel');
    expect(req.request.method).toBe('POST');
    req.flush(cancelled);

    expect(result).toEqual(cancelled);
  });

  it('EP-016 downloadProof: GET /api/vacation-requests/abc/proof-document con responseType blob', () => {
    const pdf = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    let result: Blob | undefined;

    service.downloadProof('abc').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/vacation-requests/abc/proof-document');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(pdf);

    expect(result).toBe(pdf);
  });

  it('error HTTP: propaga el status al suscriptor (cancel 409)', () => {
    let status: number | undefined;

    service.cancel('abc').subscribe({
      next: () => {
        throw new Error('no debería emitir');
      },
      error: (err: { status: number }) => (status = err.status),
    });

    const req = httpMock.expectOne('/api/vacation-requests/abc/cancel');
    req.flush({ message: 'conflict' }, { status: 409, statusText: 'Conflict' });

    expect(status).toBe(409);
  });
});
