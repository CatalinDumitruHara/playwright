import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthenticationService } from './authentication.service';

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

  describe('getSessionContext', () => {
    it('should call the correct URL and return session context data', () => {
      const mockSessionContext = {
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com'
        },
        permissions: ['read', 'write']
      };

      const expectedUrl = '/auth/sessions/current';

      service.getSessionContext().subscribe(data => {
        expect(data).toEqual(mockSessionContext);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockSessionContext);
    });
  });
});
