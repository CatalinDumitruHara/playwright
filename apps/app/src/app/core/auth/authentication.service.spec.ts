import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthenticationService } from './authentication.service';
import { SessionContext } from '@api-types';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthenticationService]
    });
    service = TestBed.inject(AuthenticationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSessionContext should fetch and store session context', () => {
    const mockSession: SessionContext = {
      user: { name: 'Test User', email: 'test@test.com' },
      permissions: ['user']
    };

    service.getSessionContext().subscribe();

    const req = httpMock.expectOne('/auth/sessions/current');
    expect(req.request.method).toBe('GET');
    req.flush(mockSession);

    expect(service.sessionContext()).toEqual(mockSession);
  });

  it('isAuthenticated should be true when session context exists', () => {
    const mockSession: SessionContext = {
      user: { name: 'Test User', email: 'test@test.com' },
      permissions: ['user']
    };

    service.getSessionContext().subscribe();

    const req = httpMock.expectOne('/auth/sessions/current');
    req.flush(mockSession);

    expect(service.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated should be false when session context is null', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  // NOTE: hasRole is implemented incorrectly in the service (uses computed property with a parameter)
  // and uses `roles` instead of `permissions`.
  // This test is adapted to what the implementation *should* be.
  // A finding will be reported.
  it('hasRole should return true for an existing role', (done) => {
    const mockSession: SessionContext = {
      user: { name: 'Test User', email: 'test@test.com' },
      permissions: ['admin']
    };

    service.getSessionContext().subscribe(() => {
      // This is how hasRole should be called, but it's a computed property
      // expect(service.hasRole('admin')()).toBe(true);
      
      // Let's test the faulty implementation to see it fail as expected
      const hasRoleFn = service.hasRole('admin');
      expect(hasRoleFn()).toBe(true);
      done();
    });

    const req = httpMock.expectOne('/auth/sessions/current');
    req.flush(mockSession);
  });

  it('hasRole should return false for a non-existing role', (done) => {
    const mockSession: SessionContext = {
      user: { name: 'Test User', email: 'test@test.com' },
      permissions: ['user']
    };

    service.getSessionContext().subscribe(() => {
      const hasRoleFn = service.hasRole('admin');
      expect(hasRoleFn()).toBe(false);
      done();
    });

    const req = httpMock.expectOne('/auth/sessions/current');
    req.flush(mockSession);
  });

  it('logout should clear session context', () => {
    const mockSession: SessionContext = {
      user: { name: 'Test User', email: 'test@test.com' },
      permissions: ['user']
    };

    service.getSessionContext().subscribe();
    const getReq = httpMock.expectOne('/auth/sessions/current');
    getReq.flush(mockSession);

    expect(service.sessionContext()).toEqual(mockSession);

    service.logout().subscribe();

    const delReq = httpMock.expectOne('/auth/sessions/current');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({});

    expect(service.sessionContext()).toBeNull();
  });
});
