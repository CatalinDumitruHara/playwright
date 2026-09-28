
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { appRoutes } from './app.routes';
import { AuthenticationService } from './core/auth/authentication.service';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { SessionContext } from '@api-types';

describe('App Routes', () => {
  let router: Router;
  let authService: AuthenticationService;

  const mockAuthenticationService = {
    get currentSession() {
      return null;
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(appRoutes)],
      providers: [
        importProvidersFrom(HttpClientModule),
        { provide: AuthenticationService, useValue: mockAuthenticationService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthenticationService);
  });

  it('should redirect to "home" when the path is empty', fakeAsync(() => {
    const navigateSpy = jest.spyOn(router, 'navigate');
    router.navigate(['']);
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(['/home'], expect.anything());
  }));

  it('should navigate to "home" for an authenticated user', fakeAsync(() => {
    Object.defineProperty(mockAuthenticationService, 'currentSession', {
      get: jest.fn(
        () =>
          ({
            user: { name: 'test', email: 'test@test.com' },
            permissions: [],
          } as SessionContext)
      ),
    });
    router.navigate(['/home']);
    tick();
    expect(router.url).toBe('/home');
  }));

  it('should redirect to "unauthorized" for a user without "admin" role trying to access "users"', fakeAsync(() => {
    Object.defineProperty(mockAuthenticationService, 'currentSession', {
      get: jest.fn(
        () =>
          ({
            user: { name: 'test', email: 'test@test.com' },
            permissions: ['user'],
          } as SessionContext)
      ),
    });
    const navigateSpy = jest.spyOn(router, 'navigate');
    router.navigate(['/users']);
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(['/unauthorized']);
  }));

  it('should allow access to "users" for a user with "admin" role', fakeAsync(() => {
    Object.defineProperty(mockAuthenticationService, 'currentSession', {
      get: jest.fn(
        () =>
          ({
            user: { name: 'test', email: 'test@test.com' },
            permissions: ['admin'],
          } as SessionContext)
      ),
    });
    router.navigate(['/users']);
    tick();
    expect(router.url).toBe('/users');
  }));

  it('should redirect to "login" for an unauthenticated user', fakeAsync(() => {
    Object.defineProperty(mockAuthenticationService, 'currentSession', {
      get: jest.fn(() => null),
    });
    const navigateSpy = jest.spyOn(router, 'navigate');
    router.navigate(['/home']);
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));

  it('should redirect to "home" for a non-existing route', fakeAsync(() => {
    const navigateSpy = jest.spyOn(router, 'navigateByUrl');
    router.navigateByUrl('/non-existing-route');
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(
      expect.stringContaining('/home'),
      expect.anything()
    );
  }));
});
