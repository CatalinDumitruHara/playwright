import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';
import { MyIncidentsService } from './my-incidents.service';
import { DEFAULT_PAGE_SIZE, HistoryEntry, PhotoContent } from './my-incidents.models';

const IDENTITY_PARAMS = ['user_id', 'userId', 'reporter_id', 'reported_by', 'created_by', 'email', 'owner_id'];

describe('MyIncidentsService (contrato EP-027 / EP-028 / EP-029 / EP-030)', () => {
  let service: MyIncidentsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    service = TestBed.inject(MyIncidentsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('EP-027: list hace GET /api/my-incidents con page/page_size y sin parámetro de identidad', () => {
    service.list({ page: 2, page_size: 10 }).subscribe();

    const req = http.expectOne((r) => r.url === '/api/my-incidents');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('10');
    for (const key of IDENTITY_PARAMS) {
      expect(req.request.params.has(key)).toBe(false);
    }
    expect(req.request.params.keys().sort()).toEqual(['page', 'page_size']);
    req.flush({ items: [], total: 0, page: 2, page_size: 10 });
  });

  it('EP-027: list sin paginación usa page=1 y el page_size por defecto', () => {
    service.list({}).subscribe();

    const req = http.expectOne((r) => r.url === '/api/my-incidents');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('page_size')).toBe(String(DEFAULT_PAGE_SIZE));
    req.flush({ items: [] });
  });

  it('EP-027: list envía filtros y tampoco añade identidad de usuario', () => {
    service
      .list({ status_code: ['ABIERTA', 'EN_CURSO'], search_text: '  luz ', sort_by: undefined, page: 1 })
      .subscribe();

    const req = http.expectOne((r) => r.url === '/api/my-incidents');
    expect(req.request.params.getAll('status_code')).toEqual(['ABIERTA', 'EN_CURSO']);
    expect(req.request.params.get('search_text')).toBe('luz');
    for (const key of IDENTITY_PARAMS) {
      expect(req.request.params.has(key)).toBe(false);
    }
    req.flush({ items: [] });
  });

  it('EP-028: detail("9") hace GET /api/incidents/9', () => {
    service.detail('9').subscribe();

    const req = http.expectOne('/api/incidents/9');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ incident_id: '9' });
  });

  it('EP-028: detail propaga el 404 para que la pantalla redirija a no encontrada', () => {
    let status: number | undefined;
    service.detail('9').subscribe({ error: (e) => (status = e.status) });

    http.expectOne('/api/incidents/9').flush(null, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });

  it('EP-029: history("9") hace GET /api/incidents/9/history', () => {
    let result: HistoryEntry[] | undefined;
    service.history('9').subscribe((r) => (result = r));

    const req = http.expectOne('/api/incidents/9/history');
    expect(req.request.method).toBe('GET');
    req.flush({
      items: [{ from_status: null, to_status: 'ABIERTA', actor_name: 'Ana', changed_at: '2026-09-01T10:00:00Z' }],
    });
    expect(result?.length).toBe(1);
    expect(result?.[0].toStatus).toBe('ABIERTA');
  });

  it('EP-030: photo("9") hace GET /api/incidents/9/photo', () => {
    let result: PhotoContent | null | undefined;
    service.photo('9').subscribe((r) => (result = r));

    const req = http.expectOne('/api/incidents/9/photo');
    expect(req.request.method).toBe('GET');
    req.flush({ file_name: 'f.jpg', mime_type: 'image/jpeg', content_base64: 'AAAA' });
    expect(result).toEqual({ fileName: 'f.jpg', mimeType: 'image/jpeg', contentBase64: 'AAAA' });
  });
});
