
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IncidentService, API_BASE_URL } from './incident.service';

describe('IncidentService', () => {
  let service: IncidentService;
  let httpMock: HttpTestingController;
  const apiBaseUrl = 'http://test-api.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        IncidentService,
        { provide: API_BASE_URL, useValue: apiBaseUrl }
      ]
    });
    service = TestBed.inject(IncidentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createIncident', () => {
    it('should call POST to /incidents with incident data', () => {
      const incidentData = { category: 'test', description: 'test incident' };
      const mockResponse = { id: '1', ...incidentData };

      service.createIncident(incidentData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/incidents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(incidentData);
      req.flush(mockResponse);
    });
  });

  describe('getMyIncidents', () => {
    it('should call GET to /my-incidents', () => {
      const mockResponse = [{ id: '1', description: 'My test incident' }];

      service.getMyIncidents().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/my-incidents`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getIncidentDetail', () => {
    it('should call GET to /incidents/:id', () => {
      const incidentId = '123';
      const mockResponse = { id: incidentId, description: 'Detail of incident' };

      service.getIncidentDetail(incidentId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/incidents/${incidentId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getIncidentHistory', () => {
    it('should call GET to /incidents/:id/history', () => {
      const incidentId = '123';
      const mockResponse = [{ status: 'created', date: new Date() }];

      service.getIncidentHistory(incidentId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/incidents/${incidentId}/history`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getIncidentPhoto', () => {
    it('should call GET to /incidents/:id/photo', () => {
      const incidentId = '123';
      const mockResponse = { url: 'http://photo.url/123.jpg' };

      service.getIncidentPhoto(incidentId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/incidents/${incidentId}/photo`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getIncidentCategories', () => {
    it('should call GET to /incident-categories', () => {
      const mockResponse = [{ id: 'cat1', name: 'Category 1' }];

      service.getIncidentCategories().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/incident-categories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getRooms', () => {
    it('should call GET to /rooms', () => {
      const mockResponse = [{ id: 'room1', name: 'Room 1' }];

      service.getRooms().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/rooms`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
