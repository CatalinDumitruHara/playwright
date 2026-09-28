import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthenticationService } from './authentication.service';
import { Router } from '@angular/router';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  const mockRouter = {
    navigate: jest.fn(),
  };

  const mockAuthService = {
    getToken: () => 'test-token',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthenticationService,
          useValue: mockAuthService,
        },
        {
          provide: Router,
          useValue: mockRouter,
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add an Authorization header', () => {
    httpClient.get('/api/data').subscribe();

    const httpRequest = httpMock.expectOne('/api/data');

    expect(httpRequest.request.headers.has('Authorization')).toEqual(true);
    // The token is hardcoded in the interceptor
    expect(httpRequest.request.headers.get('Authorization')).toBe(
      'Bearer dummy-auth-token'
    );
  });

  it('should log to console on 401 error', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    httpClient.get('/api/data').subscribe({
      error: (error) => {
        expect(error instanceof HttpErrorResponse).toBe(true);
        expect(error.status).toBe(401);
      },
    });

    const httpRequest = httpMock.expectOne('/api/data');
    httpRequest.flush('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(consoleSpy).toHaveBeenCalledWith('Redirecting to login page...');
    consoleSpy.mockRestore();
  });

  it('should log to console on 403 error', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    httpClient.get('/api/data').subscribe({
      error: (error) => {
        expect(error instanceof HttpErrorResponse).toBe(true);
        expect(error.status).toBe(403);
      },
    });

    const httpRequest = httpMock.expectOne('/api/data');
    httpRequest.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Redirecting to unauthorized page...'
    );
    consoleSpy.mockRestore();
  });
});
