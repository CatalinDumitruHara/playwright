import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthenticationService, SessionContext, SessionDetail } from './authentication.service';

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
    const mockSessionDetail: SessionDetail = {
      token: 'abc',
      session_context: {
        user: { name: 'Test User', email: 'test@test.com', role_code: 'test-role' },
        permissions: ['user']
      }
    };

    service.getSessionContext().subscribe();

    const req = httpMock.expectOne('/auth/sessions/current');
    expect(req.request.method).toBe('GET');
    req.flush(mockSessionDetail);

    expect(service.sessionContext()).toEqual(mockSessionDetail.session_context);
  });

  it('isAuthenticated should be true when session context exists', (done) => {
    const mockSessionDetail: SessionDetail = {
        token: 'abc',
        session_context: {
          user: { name: 'Test User', email: 'test@test.com', role_code: 'test-role' },
          permissions: ['user']
        }
      };

    service.getSessionContext().subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);
        done();
    });

    const req = httpMock.expectOne('/auth/sessions/current');
    req.flush(mockSessionDetail);
  });

  it('isAuthenticated should be false when session context is null', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('hasRole should return true for an existing role', (done) => {
    const mockSessionDetail: SessionDetail = {
        token: 'abc',
        session_context: {
            user: { name: 'Test User', email: 'test@test.com', role_code: 'test-role' },
            permissions: ['admin']
        }
    };

    service.getSessionContext().subscribe(() => {
      expect(service.hasRole('admin')).toBe(true);
      done();
    });

    const req = httpMock.expectOne('/auth/sessions/current');
    req.flush(mockSessionDetail);
  });

  it('hasRole should return false for a non-existing role', (done) => {
    const mockSessionDetail: SessionDetail = {
        token: 'abc',
        session_context: {
            user: { name: 'Test User', email: 'test@test.com', role_code: 'test-role' },
            permissions: ['user']
        }
    };

    service.getSessionContext().subscribe(() => {
      expect(service.hasRole('admin')).toBe(false);
      done();
    });

    const req = httpMock.expectOne('/auth/sessions/current');
    req.flush(mockSessionDetail);
  });

  it('logout should clear session context', (done) => {
    const mockSessionDetail: SessionDetail = {
        token: 'abc',
        session_context: {
          user: { name: 'Test User', email: 'test@test.com', role_code: 'test-role' },
          permissions: ['user']
        }
      };

    service.getSessionContext().subscribe(() => {
        expect(service.sessionContext()).toBeTruthy();

        service.logout().subscribe(() => {
            expect(service.sessionContext()).toBeNull();
            done();
        });

        const deleteReq = httpMock.expectOne('/auth/sessions/current');
        expect(deleteReq.request.method).toBe('DELETE');
        deleteReq.flush({});
    });

    const getReq = httpMock.expectOne('/auth/sessions/current');
    getReq.flush(mockSessionDetail);
  });
});
