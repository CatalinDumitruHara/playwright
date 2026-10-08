import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';
import {
  HierarchyList,
  HierarchyNodeDetail,
  ManagerAssignmentRequest,
} from '@api-types';
import { AdminHierarchyApiService } from './admin-hierarchy-api.service';

describe('AdminHierarchyApiService', () => {
  let service: AdminHierarchyApiService;
  let httpMock: HttpTestingController;

  const payload: ManagerAssignmentRequest = { manager_id: 'm1' };
  const node: HierarchyNodeDetail = {
    employee_id: 'e1',
    employee_name: 'Luis Gómez',
    manager_id: 'm1',
    manager_name: 'Marta Ruiz',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    service = TestBed.inject(AdminHierarchyApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('EP-006 list: GET /api/admin/hierarchy con page y size, devuelve el body', () => {
    const body: HierarchyList = {
      items: [
        {
          employee_id: 'e1',
          employee_name: 'Luis Gómez',
          employee_email: 'luis@test.com',
          manager_id: null,
          manager_name: null,
        },
      ],
      total: 1,
      page: 3,
      size: 5,
    };
    let result: HierarchyList | undefined;

    service.list(3, 5).subscribe((r) => (result = r));

    const req = httpMock.expectOne(
      (r) => r.url === '/api/admin/hierarchy' && r.method === 'GET'
    );
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('size')).toBe('5');
    expect(req.request.urlWithParams).toBe('/api/admin/hierarchy?page=3&size=5');
    req.flush(body);

    expect(result).toEqual(body);
  });

  it('EP-006 list: valores por defecto page=1 y size=20', () => {
    service.list().subscribe();

    const req = httpMock.expectOne('/api/admin/hierarchy?page=1&size=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, size: 20 });
  });

  it('EP-007 assignManager: POST /api/admin/employees/e1/manager con {manager_id}, devuelve el nodo', () => {
    let result: HierarchyNodeDetail | undefined;

    service.assignManager('e1', payload).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/admin/employees/e1/manager');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ manager_id: 'm1' });
    req.flush(node, { status: 201, statusText: 'Created' });

    expect(result).toEqual(node);
  });

  it('EP-008 changeManager: PUT /api/admin/employees/e1/manager con {manager_id}, devuelve el nodo', () => {
    const changed: HierarchyNodeDetail = {
      ...node,
      manager_id: 'm2',
      manager_name: 'Pedro Sanz',
    };
    let result: HierarchyNodeDetail | undefined;

    service
      .changeManager('e1', { manager_id: 'm2' })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/admin/employees/e1/manager');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ manager_id: 'm2' });
    req.flush(changed);

    expect(result).toEqual(changed);
  });

  it('EP-009 removeManager: DELETE /api/admin/employees/e1/manager sin body, completa con 204', () => {
    let completed = false;

    service.removeManager('e1').subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne('/api/admin/employees/e1/manager');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toBeNull();
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('POST, PUT y DELETE sobre la misma URL usan cada uno su verbo', () => {
    service.assignManager('e1', payload).subscribe();
    service.changeManager('e1', payload).subscribe();
    service.removeManager('e1').subscribe();

    const reqs = httpMock.match('/api/admin/employees/e1/manager');
    expect(reqs.map((r) => r.request.method)).toEqual(['POST', 'PUT', 'DELETE']);
    reqs.forEach((r) => r.flush(null));
  });

  it('propaga el error HTTP al suscriptor (409 en assignManager)', () => {
    let status: number | undefined;
    let emitted = false;

    service.assignManager('e1', payload).subscribe({
      next: () => (emitted = true),
      error: (e: { status: number }) => (status = e.status),
    });

    httpMock
      .expectOne('/api/admin/employees/e1/manager')
      .flush({ message: 'conflict' }, { status: 409, statusText: 'Conflict' });

    expect(emitted).toBe(false);
    expect(status).toBe(409);
  });
});
