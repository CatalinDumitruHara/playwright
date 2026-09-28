
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthenticationService } from './authentication.service';
import { SessionContext } from '@api-types';
import { BehaviorSubject } from 'rxjs';

class MockAuthService {
  _currentSession: SessionContext | null = null;

  get currentSession(): SessionContext | null {
    return this._currentSession;
  }
}

describe('roleGuard', () => {
  let router: Router;
  let authService: MockAuthService;

  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        {
          provide: AuthenticationService,
          useClass: MockAuthService,
        },
      ],
    });

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthenticationService) as unknown as MockAuthService;
  });

  it('should return true if user has an allowed role', () => {
    authService._currentSession = { user: { name: 'test', email: 'test@test.com' }, permissions: ['admin'] };
    const route = { data: { roles: ['admin', 'editor'] } } as unknown as ActivatedRouteSnapshot;
    const canActivate = TestBed.runInInjectionContext(() => roleGuard(route, dummyState));
    expect(canActivate).toBe(true);
  });

  it('should return false if user does not have an allowed role', () => {
    authService._currentSession = { user: { name: 'test', email: 'test@test.com' }, permissions: ['user'] };
    const route = { data: { roles: ['admin', 'editor'] } } as unknown as ActivatedRouteSnapshot;
    jest.spyOn(router, 'navigate');
    const canActivate = TestBed.runInInjectionContext(() => roleGuard(route, dummyState));
    expect(canActivate).toBe(false);
  });

  it('should return false if user is not logged in', () => {
    authService._currentSession = null;
    const route = { data: { roles: ['admin'] } } as unknown as ActivatedRouteSnapshot;
    jest.spyOn(router, 'navigate');
    const canActivate = TestBed.runInInjectionContext(() => roleGuard(route, dummyState));
    expect(canActivate).toBe(false);
  });
});
