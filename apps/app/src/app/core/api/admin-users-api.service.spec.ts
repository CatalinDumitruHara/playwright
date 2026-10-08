import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';
import {
  UserCreateRequest,
  UserDetail,
  UserList,
  UserStatusUpdateRequest,
  UserUpdateRequest,
} from '@api-types';
import { AdminUsersApiService } from './admin-users-api.service';

describe('AdminUsersApiService', () => {
  let service: AdminUsersApiService;
  let httpMock: HttpTestingController;

  const detail: UserDetail = {
    user_id: 'u1',
    full_name: 'Ana Pérez',
    email: 'ana@test.com',
    user_role: 'EMPLEADO',
    status: 'Activo',
    manager_name: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    service = TestBed.inject(AdminUsersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('EP-001 list: GET /api/admin/users con page y size, devuelve el body', () => {
    const body: UserList = {
      items: [
        {
          user_id: 'u1',
          full_name: 'Ana Pérez',
          email: 'ana@test.com',
          user_role: 'EMPLEADO',
          status: 'Activo',
        },
      ],
      total: 1,
      page: 2,
      size: 10,
    };
    let result: UserList | undefined;

    service.list(2, 10).subscribe((r) => (result = r));

    const req = httpMock.expectOne(
      (r) => r.url === '/api/admin/users' && r.method === 'GET'
    );
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.urlWithParams).toBe('/api/admin/users?page=2&size=10');
    req.flush(body);

    expect(result).toEqual(body);
  });

  it('EP-001 list: valores por defecto page=1 y size=20', () => {
    service.list().subscribe();

    const req = httpMock.expectOne('/api/admin/users?page=1&size=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, size: 20 });
  });

  it('EP-002 create: POST /api/admin/users con el body, devuelve UserDetail', () => {
    const payload: UserCreateRequest = {
      full_name: 'Ana Pérez',
      email: 'ana@test.com',
      user_role: 'EMPLEADO',
      initial_password: 'Secreta1!',
    };
    let result: UserDetail | undefined;

    service.create(payload).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/admin/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(detail, { status: 201, statusText: 'Created' });

    expect(result).toEqual(detail);
  });

  it('EP-003 getById: GET /api/admin/users/u1, devuelve UserDetail', () => {
    let result: UserDetail | undefined;

    service.getById('u1').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/admin/users/u1');
    expect(req.request.method).toBe('GET');
    req.flush(detail);

    expect(result).toEqual(detail);
  });

  it('EP-004 update: PUT /api/admin/users/u1 con el body, devuelve UserDetail', () => {
    const payload: UserUpdateRequest = {
      full_name: 'Ana P. López',
      user_role: 'MANAGER',
    };
    const updated: UserDetail = { ...detail, ...payload };
    let result: UserDetail | undefined;

    service.update('u1', payload).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/admin/users/u1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it("EP-005 updateStatus: PATCH /api/admin/users/u1/status con {status:'Inactivo'}, devuelve UserDetail", () => {
    const payload: UserStatusUpdateRequest = { status: 'Inactivo' };
    const updated: UserDetail = { ...detail, status: 'Inactivo' };
    let result: UserDetail | undefined;

    service.updateStatus('u1', payload).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/admin/users/u1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'Inactivo' });
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it('propaga el error HTTP al suscriptor (404 en getById)', () => {
    let status: number | undefined;
    let emitted = false;

    service.getById('u1').subscribe({
      next: () => (emitted = true),
      error: (e: { status: number }) => (status = e.status),
    });

    httpMock
      .expectOne('/api/admin/users/u1')
      .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

    expect(emitted).toBe(false);
    expect(status).toBe(404);
  });
});
