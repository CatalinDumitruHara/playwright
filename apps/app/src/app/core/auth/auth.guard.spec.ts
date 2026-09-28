
import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthenticationService } from './authentication.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authenticationService: AuthenticationService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        {
          provide: AuthenticationService,
          useValue: { isAuthenticated: () => false },
        },
      ],
    });
    authenticationService = TestBed.inject(AuthenticationService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should return true if user is authenticated', () => {
    jest.spyOn(authenticationService, 'isAuthenticated').mockReturnValue(true);
    const canActivate = executeGuard({} as any, {} as any);
    expect(canActivate).toBe(true);
  });

  it('should redirect to /login and return false if user is not authenticated', () => {
    jest.spyOn(authenticationService, 'isAuthenticated').mockReturnValue(false);
        const navigateSpy = jest.spyOn(router, 'navigate');
    jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
    const canActivate = executeGuard({} as any, {} as any);
    expect(canActivate).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
