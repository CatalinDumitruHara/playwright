import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { IncidentTrayService } from '../../incident-tray.service';
import { TrayIncidentDetail } from '../../incident-tray.models';
import { StartAttentionPage, MSG_START_SUBMIT_ERROR } from './start-attention.page';

const DETAIL: TrayIncidentDetail = {
  incidentId: '7',
  incidentCode: 'INC-0007',
  roomName: 'Sala Goya',
  officeName: 'Madrid',
  categoryName: 'Climatización',
  status: 'ABIERTA',
  createdAt: '2026-09-01T09:00:00',
  updatedAt: '2026-09-01T09:00:00',
  ageDays: 1,
  reporterName: 'Ana',
  assignedTechnicianName: 'Luis Pérez',
  hasPhoto: false,
  description: 'No enfría',
  statusLabel: 'Abierta',
  statusChangedAt: '2026-09-01T09:00:00',
  assignmentStatus: 'ASIGNADA',
  assignedTechnicianId: '3',
  assignedAt: '2026-09-01T09:30:00',
  releasedAt: null,
  openedAt: '2026-09-01T09:00:00',
  inProgressAt: null,
  resolvedAt: null,
  closedAt: null,
  daysInCurrentStatus: 1,
  availableTransitions: [],
};

describe('StartAttentionPage', () => {
  let fixture: ComponentFixture<StartAttentionPage>;
  let router: Router;
  let serviceMock: { detail: jest.Mock; transition: jest.Mock; release: jest.Mock; reassign: jest.Mock; history: jest.Mock };

  const de = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const click = (id: string) => {
    (de(id).nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [StartAttentionPage],
      providers: [
        provideRouter([]),
        { provide: IncidentTrayService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(StartAttentionPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = {
      detail: jest.fn().mockReturnValue(of(DETAIL)),
      transition: jest.fn().mockReturnValue(of({ ...DETAIL, status: 'EN_CURSO' })),
      release: jest.fn(),
      reassign: jest.fn(),
      history: jest.fn(),
    };
  });

  afterEach(() => jest.restoreAllMocks());

  it('carga el detalle de la incidencia de la ruta y muestra el resumen', async () => {
    await setup();
    expect(serviceMock.detail).toHaveBeenCalledWith('7');
    expect(de('summary-code').nativeElement.textContent.trim()).toBe('INC-0007');
    expect(de('summary-target-status').nativeElement.textContent.trim()).toBe('En curso');
    expect(de('summary-assignee').nativeElement.textContent.trim()).toBe('Luis Pérez');
  });

  it('AC-CVI-01: confirmar transiciona a EN_CURSO y navega al detalle con resultado=iniciada', async () => {
    await setup();
    click('confirm');
    expect(serviceMock.transition).toHaveBeenCalledWith('7', 'EN_CURSO');
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7'], {
      queryParams: { resultado: 'iniciada' },
    });
    expect(de('submit-error')).toBeNull();
  });

  it('AC-CVI-01: cancelar vuelve al detalle sin transicionar', async () => {
    await setup();
    click('cancel');
    expect(serviceMock.transition).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7']);
  });

  it('AC-CVI-01: error 422 muestra el mensaje literal del backend en submit-error y no navega', async () => {
    serviceMock.transition.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 422, error: { message: 'La incidencia ya está en curso' } })
      )
    );
    await setup();
    click('confirm');
    const err = de('submit-error');
    expect(err).not.toBeNull();
    expect(err.componentInstance.title).toBe('La incidencia ya está en curso');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('error sin mensaje del backend muestra el texto genérico', async () => {
    serviceMock.transition.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await setup();
    click('confirm');
    expect(de('submit-error').componentInstance.title).toBe(MSG_START_SUBMIT_ERROR);
  });
});
