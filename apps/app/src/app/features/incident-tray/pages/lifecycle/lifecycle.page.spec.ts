import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { IncidentTrayService } from '../../incident-tray.service';
import { TrayIncidentDetail } from '../../incident-tray.models';
import { LifecyclePage, LOAD_ERROR_FALLBACK, NOT_REACHED_LABEL } from './lifecycle.page';

const DETAIL: TrayIncidentDetail = {
  incidentId: '7',
  incidentCode: 'INC-0007',
  roomName: 'Sala Goya',
  officeName: 'Madrid',
  categoryName: 'Climatización',
  status: 'EN_CURSO',
  createdAt: '2026-09-01T09:00:00',
  updatedAt: '2026-09-02T10:15:00',
  ageDays: 4,
  reporterName: 'Ana',
  assignedTechnicianName: 'Luis Pérez',
  hasPhoto: false,
  description: 'No enfría',
  statusLabel: 'En curso',
  statusChangedAt: '2026-09-02T10:15:00',
  assignmentStatus: 'ASIGNADA',
  assignedTechnicianId: '3',
  assignedAt: '2026-09-01T09:30:00',
  releasedAt: null,
  openedAt: '2026-09-01T09:00:00',
  inProgressAt: '2026-09-02T10:15:00',
  resolvedAt: null,
  closedAt: null,
  daysInCurrentStatus: 3,
  availableTransitions: [],
};

describe('LifecyclePage', () => {
  let fixture: ComponentFixture<LifecyclePage>;
  let router: Router;
  let serviceMock: { detail: jest.Mock; transition: jest.Mock; release: jest.Mock; reassign: jest.Mock; history: jest.Mock };

  const de = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const text = (id: string) => (de(id)?.nativeElement.textContent ?? '').trim();

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [LifecyclePage],
      providers: [
        provideRouter([]),
        { provide: IncidentTrayService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LifecyclePage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = {
      detail: jest.fn().mockReturnValue(of(DETAIL)),
      transition: jest.fn(),
      release: jest.fn(),
      reassign: jest.fn(),
      history: jest.fn(),
    };
  });

  afterEach(() => jest.restoreAllMocks());

  it('AC-CVI-07: muestra fechas alcanzadas y «Aún no alcanzada» en las pendientes', async () => {
    await setup();
    expect(serviceMock.detail).toHaveBeenCalledWith('7');
    expect(text('lc-opened')).toBe('01/09/2026 09:00');
    expect(text('lc-in-progress')).toBe('02/09/2026 10:15');
    expect(text('lc-resolved')).toBe(NOT_REACHED_LABEL);
    expect(text('lc-closed')).toBe('Aún no alcanzada');
    expect(text('lc-status')).toBe('En curso');
  });

  it('AC-CVI-07: lc-days muestra daysInCurrentStatus tal como llega del backend (3)', async () => {
    await setup();
    expect(text('lc-days')).toBe('3');
  });

  it('AC-CVI-07: sin daysInCurrentStatus muestra «—»', async () => {
    serviceMock.detail.mockReturnValue(of({ ...DETAIL, daysInCurrentStatus: null }));
    await setup();
    expect(text('lc-days')).toBe('—');
  });

  it('error de carga muestra el aviso con el mensaje del backend o el genérico', async () => {
    serviceMock.detail.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await setup();
    const err = de('load-error');
    expect(err.componentInstance.visible).toBe(true);
    expect(err.componentInstance.title).toBe(LOAD_ERROR_FALLBACK);
    expect(de('lc-days')).toBeNull();
  });

  it('volver navega al detalle de la incidencia', async () => {
    await setup();
    (de('back-to-detail').nativeElement as HTMLButtonElement).click();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7']);
  });
});
