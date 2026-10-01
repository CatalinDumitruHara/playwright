import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';
import { ReportIncidentService } from './report-incident.service';
import { CategoryOption, CreatedIncident, RoomOption } from './report-incident.models';

describe('ReportIncidentService (contrato EP-040 / EP-042 / EP-025)', () => {
  let service: ReportIncidentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    service = TestBed.inject(ReportIncidentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('EP-040: loadCategories hace GET /api/incident-categories y mapea las categorías', () => {
    let result: CategoryOption[] | undefined;
    service.loadCategories().subscribe((r) => (result = r));

    const req = http.expectOne('/api/incident-categories');
    expect(req.request.method).toBe('GET');
    req.flush({
      items: [
        { category_code: 'ELEC', category_name: 'Electricidad', is_active: true },
        { category_code: 'CLIM', category_name: 'Climatización', is_active: false },
      ],
    });

    expect(result).toEqual([
      { code: 'ELEC', name: 'Electricidad', active: true },
      { code: 'CLIM', name: 'Climatización', active: false },
    ]);
  });

  it('EP-042: loadRooms hace GET /api/rooms y mapea las salas', () => {
    let result: RoomOption[] | undefined;
    service.loadRooms().subscribe((r) => (result = r));

    const req = http.expectOne('/api/rooms');
    expect(req.request.method).toBe('GET');
    req.flush({
      items: [{ room_id: 3, room_name: 'Sala Norte', office_id: 1, office_name: 'Madrid', is_active: true }],
    });

    expect(result).toEqual([
      { id: 3, name: 'Sala Norte', officeId: 1, officeName: 'Madrid', active: true },
    ]);
  });

  it('EP-025: create hace POST /api/incidents con room_id, category_code, description recortada y photo null', () => {
    let result: CreatedIncident | undefined;
    service
      .create({ roomId: 3, categoryCode: 'ELEC', description: '   Se ha fundido la luz del techo   ', photo: null })
      .subscribe((r) => (result = r));

    const req = http.expectOne('/api/incidents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      room_id: 3,
      category_code: 'ELEC',
      description: 'Se ha fundido la luz del techo',
      photo: null,
    });
    req.flush({
      incident_id: '5',
      reference_code: 'INC-2026-000005',
      status_code: 'ABIERTA',
      created_at: '2026-09-01T10:00:00Z',
      photo_stored: true,
    });

    expect(result).toEqual({
      incidentId: '5',
      referenceCode: 'INC-2026-000005',
      status: 'ABIERTA',
      createdAt: '2026-09-01T10:00:00Z',
      photoStored: true,
    });
  });

  it('EP-025: create con foto envía file_name, mime_type y content_base64', () => {
    service
      .create({
        roomId: 3,
        categoryCode: 'ELEC',
        description: 'Descripción suficiente',
        photo: { fileName: 'f.png', mimeType: 'image/png', contentBase64: 'AAAA' },
      })
      .subscribe();

    const req = http.expectOne('/api/incidents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.photo).toEqual({ file_name: 'f.png', mime_type: 'image/png', content_base64: 'AAAA' });
    req.flush({ incident_id: '6' });
  });

  it('EP-025: propaga el error HTTP del alta', () => {
    let status: number | undefined;
    service
      .create({ roomId: 3, categoryCode: 'ELEC', description: 'Descripción suficiente', photo: null })
      .subscribe({ error: (e) => (status = e.status) });

    http.expectOne('/api/incidents').flush({ message: 'x' }, { status: 422, statusText: 'Unprocessable' });
    expect(status).toBe(422);
  });
});
