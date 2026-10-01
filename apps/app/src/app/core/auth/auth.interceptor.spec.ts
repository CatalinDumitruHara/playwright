import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthenticationService } from './authentication.service';
import { API_BASE_URL } from '../config/api-base-url.token';
import { CurrentUser } from './session.model';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: {
    isAuthenticated: jest.Mock;
    clearSession: jest.Mock;
    getToken: jest.Mock;
    sessionContext: jest.Mock;
    getSessionContext: jest.Mock;
  };
  let router: { url: string; navigate: jest.Mock };

  beforeEach(() => {
    auth = {
      isAuthenticated: jest.fn().mockReturnValue(false),
      clearSession: jest.fn(),
      getToken: jest.fn().mockReturnValue(null),
      sessionContext: jest.fn().mockReturnValue(null),
      // EP-003 real GET (pasa por el interceptor), como AuthenticationService: error -> null.
      getSessionContext: jest.fn(
        (): Observable<CurrentUser | null> =>
          http
            .get<CurrentUser | null>('/api/auth/sessions/current')
            .pipe(catchError(() => of(null)))
      ),
    };
    router = { url: '/mi-perfil', navigate: jest.fn().mockResolvedValue(true) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthenticationService, useValue: auth },
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const fail401 = { status: 401, statusText: 'Unauthorized' };
  const fail403 = { status: 403, statusText: 'Forbidden' };
  const user = (roleCode: CurrentUser['roleCode']): Partial<CurrentUser> => ({
    userId: 'u-1',
    roleCode,
  });

  it('con token añade Authorization Bearer a peticiones API aunque isAuthenticated sea false', () => {
    auth.getToken.mockReturnValue('tok-123');
    auth.isAuthenticated.mockReturnValue(false);
    http.get('/api/x').subscribe();
    const req = httpMock.expectOne('/api/x');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');
    req.flush({});
  });

  it('sin token no añade cabecera Authorization', () => {
    http.get('/api/x').subscribe();
    const req = httpMock.expectOne('/api/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('peticiones no-API (/assets/environments.json) no llevan cabecera aunque haya token', () => {
    auth.getToken.mockReturnValue('tok-123');
    http.get('/assets/environments.json').subscribe();
    const req = httpMock.expectOne('/assets/environments.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('401 con usuario en memoria: limpia sesión y navega a sesion-finalizada con returnUrl y reason expired', () => {
    auth.isAuthenticated.mockReturnValue(true);
    const errSpy = jest.fn();
    http.get('/api/x').subscribe({ error: errSpy });
    httpMock.expectOne('/api/x').flush(null, fail401);

    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/acceso/sesion-finalizada'],
      expect.objectContaining({
        queryParams: { returnUrl: '/mi-perfil' },
        state: expect.objectContaining({ reason: 'expired' }),
      })
    );
    expect(errSpy).toHaveBeenCalled();
  });

  it('401 sin usuario en memoria: navega a /acceso con returnUrl', () => {
    auth.isAuthenticated.mockReturnValue(false);
    http.get('/api/x').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/x').flush(null, fail401);

    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/acceso'], {
      queryParams: { returnUrl: '/mi-perfil' },
    });
  });

  it('401 en POST /api/auth/sessions (login): ni clearSession ni navigate; el error llega al suscriptor', () => {
    auth.isAuthenticated.mockReturnValue(true);
    const errSpy = jest.fn();
    http.post('/api/auth/sessions', {}).subscribe({ error: errSpy });
    httpMock.expectOne('/api/auth/sessions').flush(null, fail401);

    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect((errSpy.mock.calls[0][0] as HttpErrorResponse).status).toBe(401);
  });

  it('401 en GET /api/auth/sessions/current: limpia sesión pero no navega', () => {
    auth.isAuthenticated.mockReturnValue(true);
    http.get('/api/auth/sessions/current').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/auth/sessions/current').flush(null, fail401);

    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('403: navega a /acceso-no-autorizado con ruta actual y propaga el error', () => {
    auth.isAuthenticated.mockReturnValue(true);
    const errSpy = jest.fn();
    http.get('/api/x').subscribe({ error: errSpy });
    httpMock.expectOne('/api/x').flush(null, fail403);
    httpMock.expectOne('/api/auth/sessions/current').flush(null);

    expect(router.navigate).toHaveBeenCalledWith(['/acceso-no-autorizado'], {
      queryParams: { ruta: '/mi-perfil' },
    });
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect((errSpy.mock.calls[0][0] as HttpErrorResponse).status).toBe(403);
  });

  it('FLOW-028: 403 con rol cambiado tras re-resolver EP-003 navega a /avisos/permisos-actualizados', () => {
    auth.sessionContext.mockReturnValue(user('ROL-001'));
    const errSpy = jest.fn();
    http.get('/api/x').subscribe({ error: errSpy });
    httpMock.expectOne('/api/x').flush(null, fail403);
    const ctx = httpMock.expectOne('/api/auth/sessions/current');
    expect(ctx.request.method).toBe('GET');
    ctx.flush(user('ROL-003'));

    expect(auth.getSessionContext).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/avisos/permisos-actualizados'], {
      state: { previousRole: 'ROL-001' },
    });
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect((errSpy.mock.calls[0][0] as HttpErrorResponse).status).toBe(403);
  });

  it('FLOW-028: 403 con el mismo rol tras re-resolver EP-003 navega a /acceso-no-autorizado', () => {
    auth.sessionContext.mockReturnValue(user('ROL-002'));
    http.get('/api/x').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/x').flush(null, fail403);
    httpMock.expectOne('/api/auth/sessions/current').flush(user('ROL-002'));

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/acceso-no-autorizado'], {
      queryParams: { ruta: '/mi-perfil' },
    });
  });

  it('403 en la propia GET /api/auth/sessions/current: navega directo a /acceso-no-autorizado sin re-resolver', () => {
    auth.sessionContext.mockReturnValue(user('ROL-001'));
    http.get('/api/auth/sessions/current').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/auth/sessions/current').flush(null, fail403);

    expect(auth.getSessionContext).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/acceso-no-autorizado'], {
      queryParams: { ruta: '/mi-perfil' },
    });
  });
});
