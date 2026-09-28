import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthenticationService } from './authentication.service';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { SessionContext } from '@api-types';

describe('roleGuard', () => {
  const executeGuard: CanActivateFn = (route, state) =>
    TestBed.runInInjectionContext(() => roleGuard(route, state));

  let authServiceMock: {
    sessionContext: jest.Mock
  };
  let router: Router;

  beforeEach(() => {
    authServiceMock = {
      sessionContext: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        {
          provide: AuthenticationService,
          useValue: authServiceMock,
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('should return true if user has an allowed role', () => {
    const session = { role_code: 'ROL-003' } as SessionContext;
    authServiceMock.sessionContext.mockReturnValue(signal(session)());
    const route = { data: { roles: ['ROL-003'] } } as unknown as ActivatedRouteSnapshot;

    const canActivate = executeGuard(route, {} as RouterStateSnapshot);
    expect(canActivate).toBe(true);
  });

  it('should redirect to /unauthorized and return false if user does not have an allowed role', () => {
    const session = { role_code: 'ROL-001' } as SessionContext;
    authServiceMock.sessionContext.mockReturnValue(signal(session)());
    const navigateSpy = jest.spyOn(router, 'navigate');
    const route = { data: { roles: ['ROL-003'] } } as unknown as ActivatedRouteSnapshot;

    const canActivate = executeGuard(route, {} as RouterStateSnapshot);

    expect(canActivate).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/unauthorized']);
  });

  it('should redirect to /unauthorized and return false if there is no session', () => {
    authServiceMock.sessionContext.mockReturnValue(signal(null)());
    const navigateSpy = jest.spyOn(router, 'navigate');
    const route = { data: { roles: ['ROL-003'] } } as unknown as ActivatedRouteSnapshot;

    const canActivate = executeGuard(route, {} as RouterStateSnapshot);

    expect(canActivate).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/unauthorized']);
  });
});
