import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideEnvironment } from '@mapfre-tech/ngx-multienvironment/core';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthenticationService, SESSION_TOKEN_STORAGE_KEY } from './authentication.service';
import { CurrentUser } from './session.model';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let httpMock: HttpTestingController;

  const loadSession = (roleCode = 'ROL-002'): void => {
    service.getSessionContext().subscribe();
    httpMock
      .expectOne({ method: 'GET', url: '/api/auth/sessions/current' })
      .flush({ user_id: 'u1', full_name: 'Ana Pérez', email: 'ana@mapfre.com', role_code: roleCode });
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }],
    });
    service = TestBed.inject(AuthenticationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getSessionContext (EP-003)', () => {
    it('GETs /api/auth/sessions/current and stores the CurrentUser', () => {
      let result: CurrentUser | null | undefined;
      service.getSessionContext().subscribe((u) => (result = u));
      const req = httpMock.expectOne('/api/auth/sessions/current');
      expect(req.request.method).toBe('GET');
      req.flush({ user_id: 'u1', full_name: 'Ana Pérez', email: 'ana@mapfre.com', role_code: 'ROL-002' });

      const expected: CurrentUser = {
        userId: 'u1',
        fullName: 'Ana Pérez',
        email: 'ana@mapfre.com',
        roleCode: 'ROL-002',
        roleLabel: 'Técnico de mantenimiento',
        mustChangePassword: false,
      };
      expect(result).toEqual(expected);
      expect(service.currentUser()).toEqual(expected);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('emits null, is not authenticated and removes token when role_code is missing (REQ-010)', () => {
      localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, 'old');
      let result: CurrentUser | null | undefined;
      service.getSessionContext().subscribe((u) => (result = u));
      httpMock.expectOne('/api/auth/sessions/current').flush({ user_id: 'u1', full_name: 'Ana' });

      expect(result).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('emits null (no error) and clears session on 401', () => {
      loadSession();
      localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, 'old');
      let result: CurrentUser | null | undefined;
      const error = jest.fn();
      service.getSessionContext().subscribe({ next: (u) => (result = u), error });
      httpMock
        .expectOne('/api/auth/sessions/current')
        .flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(result).toBeNull();
      expect(error).not.toHaveBeenCalled();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)).toBeNull();
    });
  });

  describe('login (EP-001)', () => {
    it('POSTs /api/auth/sessions, stores token and current user', () => {
      const body = { email: 'x@mapfre.com', password: 'secret' } as never;
      let result: CurrentUser | null | undefined;
      service.login(body).subscribe((u) => (result = u));
      const req = httpMock.expectOne('/api/auth/sessions');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ token: 't1', role_code: 'EMPLEADO', full_name: 'X' });

      expect(localStorage.getItem('sessionToken')).toBe('t1');
      expect(service.currentUser()?.roleCode).toBe('ROL-001');
      expect(result?.roleCode).toBe('ROL-001');
    });
  });

  describe('logout (EP-002)', () => {
    it('DELETEs /api/auth/sessions/current, clears session and completes on 204', () => {
      loadSession();
      localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, 't1');
      const complete = jest.fn();
      service.logout().subscribe({ complete });
      const req = httpMock.expectOne('/api/auth/sessions/current');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(complete).toHaveBeenCalled();
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('is idempotent on 401: no error propagated, session cleared', () => {
      loadSession();
      localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, 't1');
      const error = jest.fn();
      const complete = jest.fn();
      service.logout().subscribe({ error, complete });
      httpMock
        .expectOne({ method: 'DELETE', url: '/api/auth/sessions/current' })
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(error).not.toHaveBeenCalled();
      expect(complete).toHaveBeenCalled();
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('propagates 500 and does NOT clear the session', () => {
      loadSession();
      localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, 't1');
      const error = jest.fn();
      service.logout().subscribe({ error });
      httpMock
        .expectOne({ method: 'DELETE', url: '/api/auth/sessions/current' })
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0][0].status).toBe(500);
      expect(service.currentUser()).not.toBeNull();
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)).toBe('t1');
    });
  });

  describe('hasRole / hasAnyRole', () => {
    it('returns false before a session is loaded', () => {
      expect(service.hasRole('ROL-003')).toBe(false);
      expect(service.hasAnyRole(['ROL-001', 'ROL-002', 'ROL-003'])).toBe(false);
    });

    it('reflects ROL-003 once loaded', () => {
      loadSession('ROL-003');
      expect(service.hasRole('ROL-003')).toBe(true);
      expect(service.hasRole('ROL-001')).toBe(false);
      expect(service.hasAnyRole(['ROL-001', 'ROL-003'])).toBe(true);
      expect(service.hasAnyRole(['ROL-001', 'ROL-002'])).toBe(false);
      expect(service.hasAnyRole([])).toBe(false);
    });
  });

  describe('password endpoints', () => {
    it('changePassword PUTs /api/auth/password (EP-005)', () => {
      const body = { current_password: 'a', new_password: 'b' } as never;
      service.changePassword(body).subscribe();
      const req = httpMock.expectOne('/api/auth/password');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('changePasswordForced PUTs /api/auth/initial-password (EP-006)', () => {
      const body = { new_password: 'Nueva123!' };
      service.changePasswordForced(body).subscribe();
      const req = httpMock.expectOne('/api/auth/initial-password');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});

describe('API_BASE_URL default factory', () => {
  it('reads apiBaseUrl from the environment config and strips the trailing slash', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideEnvironment('dev', { apiBaseUrl: '/api/' } as never)],
    });
    expect(TestBed.inject(API_BASE_URL)).toBe('/api');
  });
});
