import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { roleGuard, roleGuardChild } from './role.guard';
import { AuthenticationService } from './authentication.service';
import { CurrentUser, RoleCode } from './session.model';
import { API_BASE_URL } from '../config/api-base-url.token';

const empleado: CurrentUser = {
  userId: 'u-1',
  fullName: 'Ana Pérez',
  email: 'ana@example.com',
  roleCode: 'ROL-001',
  roleLabel: 'Empleado',
  mustChangePassword: false,
};

describe('roleGuard / roleGuardChild', () => {
  let router: Router;
  let current: ReturnType<typeof signal<CurrentUser | null>>;
  let auth: {
    isAuthenticated: jest.Mock;
    sessionContext: jest.Mock;
    getSessionContext: jest.Mock;
    clearSession: jest.Mock;
    getToken: jest.Mock;
    hasAnyRole: jest.Mock;
  };

  const routeWith = (data: Record<string, unknown> | undefined) =>
    ({ data } as unknown as ActivatedRouteSnapshot);
  const stateFor = (url: string) => ({ url } as RouterStateSnapshot);

  beforeEach(() => {
    current = signal<CurrentUser | null>(null);
    auth = {
      isAuthenticated: jest.fn(() => current() !== null),
      sessionContext: jest.fn(() => current()),
      getSessionContext: jest.fn(() => of(current())),
      clearSession: jest.fn(() => current.set(null)),
      getToken: jest.fn().mockReturnValue(null),
      hasAnyRole: jest.fn((roles: readonly RoleCode[]) => {
        const u = current();
        return u !== null && roles.includes(u.roleCode);
      }),
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

  const guards: Array<[string, CanActivateFn]> = [
    ['roleGuard', roleGuard],
    ['roleGuardChild', roleGuardChild as unknown as CanActivateFn],
  ];

  describe.each(guards)('%s', (_name, guard) => {
    const run = (data: Record<string, unknown> | undefined, url: string) =>
      TestBed.runInInjectionContext(() => guard(routeWith(data), stateFor(url)));

    it('data.roles [ROL-003] y hasAnyRole true → true', () => {
      current.set({ ...empleado, roleCode: 'ROL-003', roleLabel: 'Administrador' });
      expect(run({ roles: ['ROL-003'] }, '/admin')).toBe(true);
      expect(auth.hasAnyRole).toHaveBeenCalledWith(['ROL-003']);
    });

    it('AC-PERM-04: rol no permitido (ROL-001) → UrlTree /acceso-no-autorizado?ruta=%2Fadmin', () => {
      current.set(empleado);
      const result = run({ roles: ['ROL-003'] }, '/admin');
      expect(result).toBeInstanceOf(UrlTree);
      expect(router.serializeUrl(result as UrlTree)).toBe(
        '/acceso-no-autorizado?ruta=%2Fadmin'
      );
    });

    it('deny-by-default: ruta sin data.roles → UrlTree a /acceso-no-autorizado', () => {
      current.set({ ...empleado, roleCode: 'ROL-003', roleLabel: 'Administrador' });
      for (const data of [undefined, {}, { roles: [] }]) {
        const result = run(data, '/admin');
        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe(
          '/acceso-no-autorizado?ruta=%2Fadmin'
        );
      }
      expect(auth.hasAnyRole).not.toHaveBeenCalled();
    });
  });

  it('roleGuardChild devuelve lo mismo que roleGuard para las mismas entradas', () => {
    current.set(empleado);
    const cases: Array<Record<string, unknown> | undefined> = [
      { roles: ['ROL-001'] },
      { roles: ['ROL-003'] },
      undefined,
    ];
    for (const data of cases) {
      const a = TestBed.runInInjectionContext(() =>
        roleGuard(routeWith(data), stateFor('/admin'))
      );
      const b = TestBed.runInInjectionContext(() =>
        roleGuardChild(routeWith(data), stateFor('/admin'))
      );
      const norm = (r: unknown) =>
        r instanceof UrlTree ? router.serializeUrl(r) : r;
      expect(norm(b)).toEqual(norm(a));
    }
  });
});
