import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthenticationService } from './authentication.service';
import { CurrentUser } from './session.model';
import { API_BASE_URL } from '../config/api-base-url.token';

const user = (over: Partial<CurrentUser> = {}): CurrentUser => ({
  userId: 'u-1',
  fullName: 'Ana Pérez',
  email: 'ana@example.com',
  roleCode: 'ROL-001',
  roleLabel: 'Empleado',
  mustChangePassword: false,
  ...over,
});

describe('authGuard', () => {
  let auth: {
    isAuthenticated: jest.Mock;
    sessionContext: jest.Mock;
    getSessionContext: jest.Mock;
    clearSession: jest.Mock;
    getToken: jest.Mock;
    hasAnyRole: jest.Mock;
  };
  let router: Router;

  const route = {} as ActivatedRouteSnapshot;
  const stateFor = (url: string) => ({ url } as RouterStateSnapshot);
  const run = (url = '/mi-perfil') =>
    TestBed.runInInjectionContext(() => authGuard(route, stateFor(url)));

  beforeEach(() => {
    auth = {
      isAuthenticated: jest.fn().mockReturnValue(false),
      sessionContext: jest.fn().mockReturnValue(null),
      getSessionContext: jest.fn().mockReturnValue(of(null)),
      clearSession: jest.fn(),
      getToken: jest.fn().mockReturnValue(null),
      hasAnyRole: jest.fn().mockReturnValue(false),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: auth },
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('usuario en memoria sin mustChangePassword → true (sin pedir contexto)', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.sessionContext.mockReturnValue(user());
    expect(run()).toBe(true);
    expect(auth.getSessionContext).not.toHaveBeenCalled();
  });

  it('usuario con mustChangePassword → UrlTree a /acceso/cambio-obligatorio-contrasena', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.sessionContext.mockReturnValue(user({ mustChangePassword: true }));
    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/acceso/cambio-obligatorio-contrasena'
    );
  });

  it('sin usuario en memoria y getSessionContext emite usuario → emite true', async () => {
    auth.getSessionContext.mockReturnValue(of(user()));
    const result = run();
    expect(result).toBeInstanceOf(Observable);
    await expect(firstValueFrom(result as Observable<unknown>)).resolves.toBe(true);
    expect(auth.getSessionContext).toHaveBeenCalledTimes(1);
  });

  it('sin usuario y getSessionContext emite null → UrlTree a /acceso con returnUrl', async () => {
    auth.getSessionContext.mockReturnValue(of(null));
    const result = await firstValueFrom(run('/mi-perfil') as Observable<unknown>);
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/acceso?returnUrl=%2Fmi-perfil'
    );
  });
});
