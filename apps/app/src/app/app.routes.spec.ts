import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { appRoutes } from './app.routes';
import { AuthenticationService } from './core/auth/authentication.service';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { SessionContext } from '@api-types';
import { WelcomePage } from './pages/welcome/welcome.page';
import { UnauthorizedAccessComponent as UnauthorizedAccessPage } from './pages/unauthorized-access/unauthorized-access.page';

describe('App Routes', () => {
  let router: Router;
  let authService: AuthenticationService;
  let consoleSpy: jest.SpyInstance;

  const mockAuthenticationService = {
    _currentSession: null as SessionContext | null,
    get currentSession() {
      return this._currentSession;
    },
  };

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [WelcomePage, UnauthorizedAccessPage, RouterTestingModule.withRoutes(appRoutes)],
      providers: [
        importProvidersFrom(HttpClientModule),
        { provide: AuthenticationService, useValue: mockAuthenticationService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthenticationService);
    router.initialNavigation();
  });
  
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should redirect to "home" when the path is empty', fakeAsync(() => {
    mockAuthenticationService._currentSession = { user: { name: 'test', email: 'test@test.com' }, permissions: ['user'] };
    router.navigate(['']);
    tick();
    expect(router.url).toBe('/home');
  }));

  it('should navigate to "home" for an authenticated user', fakeAsync(() => {
    mockAuthenticationService._currentSession = { user: { name: 'test', email: 'test@test.com' }, permissions: ['user'] };
    router.navigate(['/home']);
    tick();
    expect(router.url).toBe('/home');
  }));

  it('should redirect to "acceso-no-autorizado" for a user without "admin" role trying to access "users"', fakeAsync(() => {
    mockAuthenticationService._currentSession = { user: { name: 'test', email: 'test@test.com' }, permissions: ['user'] };
    router.navigate(['/users']);
    tick();
    expect(console.log).toHaveBeenCalledWith('Redirecting to unauthorized page');
  }));

  it('should allow access to "users" for a user with "admin" role', fakeAsync(() => {
    mockAuthenticationService._currentSession = { user: { name: 'test', email: 'test@test.com' }, permissions: ['admin'] };
    router.navigate(['/users']);
    tick();
    expect(router.url).toBe('/users');
  }));

  it('should redirect to "login" for an unauthenticated user', fakeAsync(() => {
    mockAuthenticationService._currentSession = null;
    router.navigate(['/home']);
    tick();
    expect(console.log).toHaveBeenCalledWith('Redirecting to login page');
  }));

  it('should redirect to "home" for a non-existing route', fakeAsync(() => {
    mockAuthenticationService._currentSession = { user: { name: 'test', email: 'test@test.com' }, permissions: ['user'] };
    router.navigateByUrl('/non-existing-route');
    tick();
    expect(router.url).toBe('/home');
  }));
});
