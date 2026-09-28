
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthenticationService } from './authentication.service';
import { SessionContext } from '@api-types';
import { BehaviorSubject } from 'rxjs';

class MockAuthService {
  _currentSession: SessionContext | null = null;

  get currentSession(): SessionContext | null {
    return this._currentSession;
  }
}

describe('authGuard', () => {
  let router: Router;
  let authService: MockAuthService;

  const dummyRoute = {} as ActivatedRouteSnapshot;
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

  it('should return true for an authenticated user', () => {
    authService._currentSession = { user: { name: 'test', email: 'test@test.com' }, permissions: [] };
    const canActivate = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
    expect(canActivate).toBe(true);
  });

  it('should return false and redirect for an unauthenticated user', () => {
    authService._currentSession = null;
    jest.spyOn(router, 'navigate');
    const canActivate = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
    expect(canActivate).toBe(false);
  });
});
