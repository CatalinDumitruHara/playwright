import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Params, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { IncidentTrayService } from '../../incident-tray.service';
import { AvailableTransition, TrayIncidentDetail } from '../../incident-tray.models';
import { TrayIncidentDetailPage } from './tray-incident-detail.page';

const BASE: TrayIncidentDetail = {
  incidentId: '7',
  incidentCode: 'INC-0007',
  roomName: 'Sala Goya',
  officeName: 'Madrid Majadahonda',
  categoryName: 'Climatización',
  status: 'ABIERTA',
  createdAt: '2026-09-01T09:00:00',
  updatedAt: '2026-09-02T10:00:00',
  ageDays: 3,
  reporterName: 'Ana García',
  assignedTechnicianName: null,
  hasPhoto: false,
  description: 'El aire acondicionado no enfría',
  statusLabel: 'Abierta',
  statusChangedAt: '2026-09-01T09:00:00',
  assignmentStatus: 'SIN_ASIGNAR',
  assignedTechnicianId: null,
  assignedAt: null,
  releasedAt: null,
  openedAt: '2026-09-01T09:00:00',
  inProgressAt: null,
  resolvedAt: null,
  closedAt: null,
  daysInCurrentStatus: 3,
  availableTransitions: [],
};

const ASSIGNED: TrayIncidentDetail = {
  ...BASE,
  status: 'EN_CURSO',
  statusLabel: 'En curso',
  assignmentStatus: 'ASIGNADA',
  assignedTechnicianId: '15',
  assignedTechnicianName: 'Luis Pérez',
  assignedAt: '2026-09-10T08:30:00',
};

const transition = (t: Partial<AvailableTransition>): AvailableTransition => ({
  toStatus: 'EN_CURSO',
  label: 'Iniciar atención',
  requiresComment: false,
  blockedReason: null,
  ...t,
});

describe('TrayIncidentDetailPage', () => {
  let fixture: ComponentFixture<TrayIncidentDetailPage>;
  let router: Router;
  let serviceMock: { detail: jest.Mock; selfAssign: jest.Mock };
  let queryParams$: BehaviorSubject<Params>;

  const q = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const qAll = (id: string) => fixture.debugElement.queryAll(By.css(`[data-testid="${id}"]`));
  const el = (id: string): HTMLElement | null => q(id)?.nativeElement ?? null;
  const text = (id: string): string => (el(id)?.textContent ?? '').trim();
  const click = (id: string): void => {
    const e = el(id);
    if (!e) throw new Error(`No existe [data-testid="${id}"]`);
    e.click();
    fixture.detectChanges();
  };
  const notificationTitle = (id: string): string | undefined =>
    q(id)?.query(By.css('b2b-notification-inline'))?.componentInstance.title;

  async function setup(detail: TrayIncidentDetail = BASE): Promise<void> {
    serviceMock.detail.mockReturnValue(of(detail));
    await TestBed.configureTestingModule({
      imports: [TrayIncidentDetailPage],
      providers: [
        provideRouter([]),
        { provide: IncidentTrayService, useValue: serviceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '7' })),
            queryParams: queryParams$.asObservable(),
            snapshot: { paramMap: convertToParamMap({ id: '7' }), queryParams: queryParams$.value },
          },
        },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(TrayIncidentDetailPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    queryParams$ = new BehaviorSubject<Params>({});
    serviceMock = { detail: jest.fn(), selfAssign: jest.fn() };
  });

  afterEach(() => jest.restoreAllMocks());

  it('AC-RESP-01: asignada muestra el técnico y la fecha de asignación dd/MM/yyyy HH:mm', async () => {
    await setup(ASSIGNED);
    expect(serviceMock.detail).toHaveBeenCalledWith('7');
    expect(text('detail-assignee')).toBe('Luis Pérez');
    expect(text('detail-assigned-at')).toBe('10/09/2026 08:30');
    expect(el('detail-pending-assignment')).toBeNull();
  });

  it('AC-RESP-01: sin asignar y ABIERTA muestra «Pendiente de asignar» y la acción de autoasignarse', async () => {
    await setup(BASE);
    expect(text('detail-pending-assignment')).toBe('Pendiente de asignar');
    expect(el('detail-assignee')).toBeNull();
    expect(el('action-self-assign')).not.toBeNull();
    expect(el('action-release')).toBeNull();
  });

  it('AC-ASG-01: autoasignarse pide confirmación, llama a selfAssign y recarga el detalle', async () => {
    serviceMock.selfAssign.mockReturnValue(of(undefined));
    await setup(BASE);
    expect(el('action-self-assign-confirm')).toBeNull();

    click('action-self-assign');
    expect(el('action-self-assign-confirm')).not.toBeNull();
    expect(serviceMock.selfAssign).not.toHaveBeenCalled();

    serviceMock.detail.mockReturnValue(of(ASSIGNED));
    click('action-self-assign-confirm');
    expect(serviceMock.selfAssign).toHaveBeenCalledWith('7');
    expect(serviceMock.detail).toHaveBeenCalledTimes(2);
    expect(text('detail-assignee')).toBe('Luis Pérez');
    expect(el('action-self-assign-confirm')).toBeNull();
  });

  it('AC-ASG-03: si otro técnico se la asignó antes (409) se muestra el mensaje literal del backend', async () => {
    serviceMock.selfAssign.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Esta incidencia ya está asignada a Luis.' },
          })
      )
    );
    await setup(BASE);
    click('action-self-assign');
    click('action-self-assign-confirm');
    expect(serviceMock.selfAssign).toHaveBeenCalledWith('7');
    expect(notificationTitle('detail-error')).toBe('Esta incidencia ya está asignada a Luis.');
  });

  it('AC-CVI-06: sin transiciones disponibles no se pinta ningún botón de transición', async () => {
    await setup({ ...ASSIGNED, availableTransitions: [] });
    expect(qAll('transition-button')).toHaveLength(0);
    expect(el('transition-blocked-reason')).toBeNull();
  });

  it('AC-CVI-04: transición bloqueada se muestra deshabilitada con su motivo y no navega', async () => {
    const reason = 'La incidencia debe tener un técnico asignado';
    await setup({ ...BASE, availableTransitions: [transition({ blockedReason: reason })] });
    const btn = el('transition-button') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.textContent?.trim()).toBe('Iniciar atención');
    expect(btn.disabled).toBe(true);
    expect(text('transition-blocked-reason')).toBe(reason);
    btn.click();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('transición EN_CURSO navega a iniciar-atencion y RESUELTA a resolver', async () => {
    await setup({
      ...ASSIGNED,
      availableTransitions: [
        transition({ toStatus: 'EN_CURSO', label: 'Iniciar atención' }),
        transition({ toStatus: 'RESUELTA', label: 'Marcar como resuelta' }),
      ],
    });
    const buttons = qAll('transition-button');
    expect(buttons).toHaveLength(2);
    buttons[0].nativeElement.click();
    expect(router.navigate).toHaveBeenLastCalledWith(['/incidencias', '7', 'iniciar-atencion']);
    buttons[1].nativeElement.click();
    expect(router.navigate).toHaveBeenLastCalledWith(['/incidencias', '7', 'resolver']);
  });

  it('ASIGNADA + EN_CURSO ofrece liberar y navega a la pantalla de liberación', async () => {
    await setup(ASSIGNED);
    expect(el('action-self-assign')).toBeNull();
    click('action-release');
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7', 'liberar']);
  });

  it('detalle inexistente (404) muestra «La incidencia solicitada no existe.»', async () => {
    serviceMock.detail.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    await TestBed.configureTestingModule({
      imports: [TrayIncidentDetailPage],
      providers: [
        provideRouter([]),
        { provide: IncidentTrayService, useValue: serviceMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '7' })), queryParams: queryParams$.asObservable() },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TrayIncidentDetailPage);
    fixture.detectChanges();
    expect(serviceMock.detail).toHaveBeenCalledWith('7');
    expect(notificationTitle('detail-error')).toBe('La incidencia solicitada no existe.');
    expect(el('detail-code')).toBeNull();
  });

  it('volver a la bandeja conserva filtros y paginación pero descarta «resultado»', async () => {
    queryParams$.next({ status: ['ABIERTA'], page: '2', page_size: '25', resultado: 'liberada' });
    await setup(ASSIGNED);
    expect(notificationTitle('detail-result')).toBe('Incidencia liberada');
    click('back-to-tray');
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias'], {
      queryParams: { status: ['ABIERTA'], page: '2', page_size: '25' },
    });
  });
});
