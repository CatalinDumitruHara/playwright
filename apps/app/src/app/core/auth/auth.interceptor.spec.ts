import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthenticationService } from './authentication.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: AuthenticationService;
  let router: Router;
  let getItemSpy: jest.SpyInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthenticationService,
          useValue: {
            isAuthenticated: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
          },
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthenticationService);
    router = TestBed.inject(Router);
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
  });

  afterEach(() => {
    httpMock.verify();
    getItemSpy.mockRestore();
  });

  it('should add Authorization header if user is authenticated', () => {
    const token = 'test-token';
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    getItemSpy.mockReturnValue(token);

    httpClient.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush({});
  });

  it('should not add Authorization header if user is not authenticated', () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    getItemSpy.mockReturnValue(null);

    httpClient.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should redirect to /login on 401 error', () => {
    const token = 'test-token';
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    getItemSpy.mockReturnValue(token);

    httpClient.get('/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpMock.expectOne('/test');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call logout on 401 error', () => {
    const token = 'test-token';
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    getItemSpy.mockReturnValue(token);

    httpClient.get('/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpMock.expectOne('/test');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).toHaveBeenCalled();
  });

  it('should redirect to /acceso-no-autorizado on 403 error', () => {
    const token = 'test-token';
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    getItemSpy.mockReturnValue(token);

    httpClient.get('/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(403);
      },
    });

    const req = httpMock.expectOne('/test');
    req.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(router.navigate).toHaveBeenCalledWith(['/acceso-no-autorizado']);
  });
});
