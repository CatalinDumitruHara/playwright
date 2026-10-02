import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { MyIncidentsService } from '../../my-incidents.service';
import { HistoryEntry, IncidentView, mapHistory, PhotoContent } from '../../my-incidents.models';
import { IncidentDetailPage } from './incident-detail.page';

const BASE: IncidentView = {
  incidentId: '42',
  referenceCode: 'INC-0042',
  roomName: 'Sala Goya',
  officeName: 'Madrid Majadahonda',
  categoryName: 'Climatización',
  description: 'El aire acondicionado no enfría',
  statusCode: 'EN_CURSO',
  createdAt: '2026-09-01T09:00:00',
  updatedAt: '2026-09-02T10:00:00',
  assignedTechnicianName: 'Luis Pérez',
  photoId: 'ph-1',
  resolutionComment: null,
  closedAt: null,
  closedByName: null,
};

const HISTORY: HistoryEntry[] = [
  { fromStatus: null, toStatus: 'ABIERTA', actorName: 'Ana', changedAt: '2026-09-01T09:00:00', comment: null, dwellMs: null },
  { fromStatus: 'ABIERTA', toStatus: 'EN_CURSO', actorName: 'Luis', changedAt: '2026-09-02T10:00:00', comment: null, dwellMs: null },
  { fromStatus: 'EN_CURSO', toStatus: 'CERRADA', actorName: 'Luis', changedAt: '2026-09-03T11:00:00', comment: 'Filtro cambiado', dwellMs: null },
];

const PHOTO: PhotoContent = { fileName: 'foto.png', mimeType: 'image/png', contentBase64: btoa('abc') };

describe('IncidentDetailPage', () => {
  let fixture: ComponentFixture<IncidentDetailPage>;
  let component: IncidentDetailPage;
  let router: Router;
  let serviceMock: { detail: jest.Mock; history: jest.Mock; photo: jest.Mock; list: jest.Mock };

  const el = (id: string): HTMLElement | null =>
    fixture.debugElement.query(By.css(`[data-testid="${id}"]`))?.nativeElement ?? null;
  const text = (id: string): string => (el(id)?.textContent ?? '').trim();

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [IncidentDetailPage],
      providers: [
        provideRouter([]),
        { provide: MyIncidentsService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '42' }) } } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(IncidentDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = {
      detail: jest.fn().mockReturnValue(of(BASE)),
      history: jest.fn().mockReturnValue(of(HISTORY)),
      photo: jest.fn().mockReturnValue(of(PHOTO)),
      list: jest.fn(),
    };
  });

  afterEach(() => jest.restoreAllMocks());

  it('AC1: EN_CURSO con técnico pinta los datos y no ofrece acciones de transición/asignación', async () => {
    await setup();
    expect(serviceMock.detail).toHaveBeenCalledWith('42');
    expect(text('detail-description')).toBe('El aire acondicionado no enfría');
    expect(text('detail-room')).toBe('Sala Goya');
    expect(text('detail-office')).toBe('Madrid Majadahonda');
    expect(text('detail-category')).toBe('Climatización');
    expect(text('detail-status')).toBe('En curso');
    expect(text('detail-technician')).toBe('Luis Pérez');

    const buttons = fixture.debugElement
      .queryAll(By.css('button'))
      .map((b) => b.nativeElement.getAttribute('data-testid'));
    expect(buttons.sort()).toEqual(['back-to-list', 'download-photo']);
  });

  it('AC2: sin técnico asignado muestra «Sin asignar»', async () => {
    serviceMock.detail.mockReturnValue(of({ ...BASE, assignedTechnicianName: null }));
    await setup();
    expect(text('detail-technician')).toBe('Sin asignar');
  });

  it('AC3: CERRADA muestra comentario, autor y fecha de cierre; no CERRADA no muestra comentario', async () => {
    serviceMock.detail.mockReturnValue(
      of({
        ...BASE,
        statusCode: 'CERRADA',
        resolutionComment: 'Filtro cambiado',
        closedByName: 'Luis Pérez',
        closedAt: '2026-09-03T11:00:00',
      })
    );
    await setup();
    expect(text('detail-status')).toBe('Cerrada');
    expect(text('detail-resolution')).toBe('Filtro cambiado');
    expect(text('detail-closed-by')).toBe('Luis Pérez');
    expect(text('detail-closed-at')).toBe('03/09/2026 11:00');

    // Mismo componente con incidencia no cerrada
    serviceMock.detail.mockReturnValue(of({ ...BASE, resolutionComment: 'no debería verse' }));
    component.load();
    fixture.detectChanges();
    expect(text('detail-status')).toBe('En curso');
    expect(el('detail-resolution')).toBeNull();
    expect(el('detail-closed-by')).toBeNull();
    expect(el('detail-closed-at')).toBeNull();
  });

  it('AC4: historial con 3 entradas pinta 3 history-entry en orden cronológico; vacío muestra aviso', async () => {
    // El orden cronológico lo garantiza el mapeo del servicio (mapHistory)
    const unordered = { items: [HISTORY[2], HISTORY[0], HISTORY[1]].map((h) => ({
      from_status: h.fromStatus, to_status: h.toStatus, actor_name: h.actorName, changed_at: h.changedAt, comment: h.comment,
    })) };
    const mapped = mapHistory(unordered as never);
    serviceMock.history.mockReturnValue(of(mapped));
    await setup();

    const entries = fixture.debugElement.queryAll(By.css('[data-testid="history-entry"]'));
    expect(entries.length).toBe(3);
    const titles = entries.map((e) => (e.componentInstance as { title?: string }).title ?? e.nativeElement.textContent);
    expect(titles[0]).toContain('Alta → Abierta');
    expect(titles[1]).toContain('Abierta → En curso');
    expect(titles[2]).toContain('En curso → Cerrada');
    expect(el('history-empty')).toBeNull();

    serviceMock.history.mockReturnValue(of([]));
    component.load();
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('[data-testid="history-entry"]')).length).toBe(0);
    const empty = fixture.debugElement.query(By.css('[data-testid="history-empty"]'));
    expect(empty).not.toBeNull();
    expect(empty.componentInstance.title).toBe('No hay cambios de estado registrados');
  });

  it.each([404, 403])('AC5: detail() con error %s navega a no-encontrada con queryParams id', async (status) => {
    serviceMock.detail.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    await setup();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias/no-encontrada'], { queryParams: { id: '42' } });
    expect(el('detail-error')).toBeNull();
  });

  it.each([
    ['null', () => of(null)],
    ['error', () => throwError(() => new HttpErrorResponse({ status: 500 }))],
  ])('AC6: downloadPhoto() con photo() %s avisa de imagen no disponible y la ficha sigue visible', async (_l, resp) => {
    serviceMock.photo.mockReturnValue(resp());
    const createSpy = jest.fn().mockReturnValue('blob:x');
    Object.defineProperty(URL, 'createObjectURL', { value: createSpy, configurable: true, writable: true });
    await setup();
    (el('download-photo') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(serviceMock.photo).toHaveBeenCalledWith('42');
    const notice = fixture.debugElement.query(By.css('[data-testid="photo-unavailable"]'));
    expect(notice).not.toBeNull();
    expect(notice.componentInstance.title).toBe('La imagen adjunta no está disponible en este momento');
    expect(text('detail-description')).toBe('El aire acondicionado no enfría');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('AC7: downloadPhoto() con contenido genera el blob con URL.createObjectURL', async () => {
    const createSpy = jest.fn().mockReturnValue('blob:foto');
    const revokeSpy = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createSpy, configurable: true, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeSpy, configurable: true, writable: true });
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await setup();
    component.downloadPhoto();
    fixture.detectChanges();

    expect(createSpy).toHaveBeenCalledTimes(1);
    const blob = createSpy.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:foto');
    expect(el('photo-unavailable')).toBeNull();
  });
});
