import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { IncidentTrayService } from './incident-tray.service';
import {
  TrayHistoryEntry,
  TrayIncidentDetail,
  TrayPage,
  TrayQuery,
  trayErrorMessage,
} from './incident-tray.models';

const BASE = '/api';

describe('IncidentTrayService (contrato EP-026 / EP-028 / EP-029 / EP-031..EP-034)', () => {
  let service: IncidentTrayService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(IncidentTrayService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('CA-1: list() sin filtros hace GET /incidents con orden y paginación por defecto y mapea la página', () => {
    let result: TrayPage | undefined;
    service.list({}).subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === `${BASE}/incidents`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('sort_by')).toBe('created_at');
    expect(req.request.params.get('sort_dir')).toBe('DESC');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('page_size')).toBe('25');
    expect(req.request.params.keys().sort()).toEqual(['page', 'page_size', 'sort_by', 'sort_dir']);

    req.flush({
      items: [
        {
          incident_id: 7,
          incident_code: 'INC-0007',
          room_name: 'Sala Norte',
          office_name: 'Madrid',
          category_name: 'Climatización',
          status: 'ABIERTA',
          age_days: 3,
          reporter_name: 'Ana',
          assigned_technician_name: 'Luis',
          has_photo: true,
        },
        {
          incident_id: 8,
          incident_code: 'INC-0008',
          room_name: 'Sala Sur',
          office_name: 'Madrid',
          category_name: 'Iluminación',
          status: 'EN_CURSO',
          age_days: 0,
          reporter_name: 'Pedro',
          assigned_technician_name: null,
          has_photo: false,
        },
      ],
      total_count: 27,
      page: 1,
      page_size: 25,
      total_pages: 2,
    });

    expect(result?.totalCount).toBe(27);
    expect(result?.totalPages).toBe(2);
    expect(result?.page).toBe(1);
    expect(result?.pageSize).toBe(25);
    expect(result?.items.length).toBe(2);
    expect(result?.items[0]).toEqual(
      expect.objectContaining({
        incidentId: '7',
        incidentCode: 'INC-0007',
        roomName: 'Sala Norte',
        officeName: 'Madrid',
        categoryName: 'Climatización',
        status: 'ABIERTA',
        ageDays: 3,
        reporterName: 'Ana',
        assignedTechnicianName: 'Luis',
        hasPhoto: true,
      })
    );
    expect(result?.items[1].assignedTechnicianName).toBeNull();
    expect(result?.items[1].hasPhoto).toBe(false);
    expect(result?.items[1].ageDays).toBe(0);
  });

  it('CA-2: list() con filtros combinados envía todos los params y recorta search_text', () => {
    const q: TrayQuery = {
      room_id: ['1', '2'],
      category_code: ['CLIMA'],
      status: ['ABIERTA', 'EN_CURSO'],
      assignment_filter: 'SIN_ASIGNAR',
      created_from: '2026-09-01',
      created_to: '2026-09-30',
      search_text: '  fuga agua  ',
      page: 2,
      page_size: 50,
    };
    service.list(q).subscribe();

    const req = http.expectOne((r) => r.url === `${BASE}/incidents`);
    const p = req.request.params;
    expect(p.getAll('room_id')).toEqual(['1', '2']);
    expect(p.getAll('category_code')).toEqual(['CLIMA']);
    expect(p.getAll('status')).toEqual(['ABIERTA', 'EN_CURSO']);
    expect(p.get('assignment_filter')).toBe('SIN_ASIGNAR');
    expect(p.get('created_from')).toBe('2026-09-01');
    expect(p.get('created_to')).toBe('2026-09-30');
    expect(p.get('search_text')).toBe('fuga agua');
    expect(p.get('page')).toBe('2');
    expect(p.get('page_size')).toBe('50');
    req.flush({ items: [], total_count: 0 });
  });

  it('CA-2: list() no envía search_text de 2 caracteres', () => {
    service.list({ search_text: ' ab ' }).subscribe();

    const req = http.expectOne((r) => r.url === `${BASE}/incidents`);
    expect(req.request.params.has('search_text')).toBe(false);
    req.flush({ items: [] });
  });

  it('CA-2: list() con page_size no permitido (30) cae a 25', () => {
    service.list({ page_size: 30 }).subscribe();

    const req = http.expectOne((r) => r.url === `${BASE}/incidents`);
    expect(req.request.params.get('page_size')).toBe('25');
    req.flush({ items: [] });
  });

  it('CA-3: detail("7") hace GET /incidents/7 y mapea available_transitions y assignment_status', () => {
    let result: TrayIncidentDetail | undefined;
    service.detail('7').subscribe((r) => (result = r));

    const req = http.expectOne(`${BASE}/incidents/7`);
    expect(req.request.method).toBe('GET');
    req.flush({
      incident_id: 7,
      incident_code: 'INC-0007',
      status: 'ABIERTA',
      assignment_status: 'ASIGNADA',
      assigned_technician_id: 12,
      assigned_technician_name: 'Luis',
      available_transitions: [
        { to_status: 'EN_CURSO', label: 'Iniciar', requires_comment: false, blocked_reason: null },
        {
          to_status: 'CERRADA',
          label: 'Cerrar',
          requires_comment: true,
          blocked_reason: 'Debe estar resuelta',
        },
      ],
    });

    expect(result?.assignmentStatus).toBe('ASIGNADA');
    expect(result?.assignedTechnicianId).toBe('12');
    expect(result?.availableTransitions).toEqual([
      { toStatus: 'EN_CURSO', label: 'Iniciar', requiresComment: false, blockedReason: null },
      {
        toStatus: 'CERRADA',
        label: 'Cerrar',
        requiresComment: true,
        blockedReason: 'Debe estar resuelta',
      },
    ]);
  });

  it('CA-3: detail() sin available_transitions devuelve array vacío', () => {
    let result: TrayIncidentDetail | undefined;
    service.detail('7').subscribe((r) => (result = r));

    http.expectOne(`${BASE}/incidents/7`).flush({ incident_id: 7, status: 'ABIERTA' });
    expect(result?.availableTransitions).toEqual([]);
    expect(result?.assignmentStatus).toBe('SIN_ASIGNAR');
  });

  it('CA-4: selfAssign("7") hace POST /incidents/7/assignment con body {} sin assigned_technician_id', () => {
    service.selfAssign('7').subscribe();

    const req = http.expectOne(`${BASE}/incidents/7/assignment`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect('assigned_technician_id' in (req.request.body as object)).toBe(false);
    req.flush({});
  });

  it('CA-5: release("7", motivo) hace DELETE /incidents/7/assignment con body { reason }', () => {
    service.release('7', 'Motivo suficientemente largo').subscribe();

    const req = http.expectOne(`${BASE}/incidents/7/assignment`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ reason: 'Motivo suficientemente largo' });
    req.flush(null);
  });

  it('CA-6: transition("7", "EN_CURSO") hace POST /incidents/7/transitions con { to_status }', () => {
    let result: TrayIncidentDetail | undefined;
    service.transition('7', 'EN_CURSO').subscribe((r) => (result = r));

    const req = http.expectOne(`${BASE}/incidents/7/transitions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ to_status: 'EN_CURSO' });
    req.flush({ incident_id: 7, status: 'EN_CURSO' });
    expect(result?.status).toBe('EN_CURSO');
  });

  it('CA-6: transition() con comentario incluye comment', () => {
    service.transition('7', 'RESUELTA', 'Cambiado el filtro').subscribe();

    const req = http.expectOne(`${BASE}/incidents/7/transitions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ to_status: 'RESUELTA', comment: 'Cambiado el filtro' });
    req.flush({ incident_id: 7, status: 'RESUELTA' });
  });

  it('CA-7: reassign("7", 12) hace PUT /incidents/7/assignment con { assigned_technician_id: 12 }', () => {
    service.reassign('7', 12).subscribe();

    const req = http.expectOne(`${BASE}/incidents/7/assignment`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ assigned_technician_id: 12 });
    req.flush({});
  });

  it('CA-8: history("7") hace GET /incidents/7/history', () => {
    let result: TrayHistoryEntry[] | undefined;
    service.history('7').subscribe((r) => (result = r));

    const req = http.expectOne(`${BASE}/incidents/7/history`);
    expect(req.request.method).toBe('GET');
    req.flush({
      items: [
        { entry_type: 'STATUS', from_status: 'ABIERTA', to_status: 'EN_CURSO', actor_name: 'Luis', changed_at: '2026-09-02T10:00:00Z' },
        { entry_type: 'STATUS', from_status: null, to_status: 'ABIERTA', actor_name: 'Ana', changed_at: '2026-09-01T10:00:00Z' },
      ],
    });
    expect(result?.length).toBe(2);
    expect(result?.[0].toStatus).toBe('ABIERTA');
  });

  describe('CA-9: trayErrorMessage', () => {
    const FALLBACK = 'No se pudo completar la acción';

    it('devuelve el mensaje del backend si viene', () => {
      const err = new HttpErrorResponse({
        status: 409,
        error: { message: 'La incidencia ya está asignada' },
      });
      expect(trayErrorMessage(err, FALLBACK)).toBe('La incidencia ya está asignada');
    });

    it('403 sin mensaje → «No tienes permisos para realizar esta acción»', () => {
      const err = new HttpErrorResponse({ status: 403, error: null });
      expect(trayErrorMessage(err, FALLBACK)).toBe('No tienes permisos para realizar esta acción');
    });

    it('otro status sin mensaje → fallback', () => {
      const err = new HttpErrorResponse({ status: 500, error: null });
      expect(trayErrorMessage(err, FALLBACK)).toBe(FALLBACK);
    });
  });
});
