import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { IncidentTrayService } from '../../incident-tray.service';
import { TrayIncidentDetail } from '../../incident-tray.models';
import { MSG_REASSIGN_TECHNICIAN, ReassignIncidentPage, toTechnicianId } from './reassign.page';

const DETAIL: TrayIncidentDetail = {
  incidentId: '7',
  incidentCode: 'INC-0007',
  roomName: 'Sala Goya',
  officeName: 'Madrid',
  categoryName: 'Climatización',
  status: 'EN_CURSO',
  createdAt: '2026-09-01T09:00:00',
  updatedAt: '2026-09-01T09:00:00',
  ageDays: 1,
  reporterName: 'Ana',
  assignedTechnicianName: 'Luis Pérez',
  hasPhoto: false,
  description: 'No enfría',
  statusLabel: 'En curso',
  statusChangedAt: '2026-09-01T09:00:00',
  assignmentStatus: 'ASIGNADA',
  assignedTechnicianId: '3',
  assignedAt: '2026-09-01T09:30:00',
  releasedAt: null,
  openedAt: '2026-09-01T09:00:00',
  inProgressAt: '2026-09-01T10:00:00',
  resolvedAt: null,
  closedAt: null,
  daysInCurrentStatus: 1,
  availableTransitions: [],
};

describe('ReassignIncidentPage', () => {
  let fixture: ComponentFixture<ReassignIncidentPage>;
  let router: Router;
  let serviceMock: { detail: jest.Mock; transition: jest.Mock; release: jest.Mock; reassign: jest.Mock; history: jest.Mock };

  const de = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const click = (id: string) => {
    (de(id).nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
  };
  const typeTechnician = (value: string) => {
    const input = de('technician-input').nativeElement as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ReassignIncidentPage],
      providers: [
        provideRouter([]),
        { provide: IncidentTrayService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ReassignIncidentPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = {
      detail: jest.fn().mockReturnValue(of(DETAIL)),
      transition: jest.fn(),
      release: jest.fn(),
      reassign: jest.fn().mockReturnValue(of({})),
      history: jest.fn(),
    };
  });

  afterEach(() => jest.restoreAllMocks());

  it('carga la incidencia y muestra el técnico actual', async () => {
    await setup();
    expect(serviceMock.detail).toHaveBeenCalledWith('7');
    expect(de('summary-assignee').nativeElement.textContent.trim()).toBe('Luis Pérez');
  });

  it.each(['', '0', '-3', '1.5'])('id de técnico inválido (%p) muestra error y no llama a reassign', async (v) => {
    await setup();
    typeTechnician(v);
    click('confirm');
    expect(de('form-error').nativeElement.textContent.trim()).toBe(MSG_REASSIGN_TECHNICIAN);
    expect(serviceMock.reassign).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('id 12 llama reassign("7", 12) y navega con resultado=reasignada', async () => {
    await setup();
    typeTechnician('12');
    click('confirm');
    expect(de('form-error')).toBeNull();
    expect(serviceMock.reassign).toHaveBeenCalledWith('7', 12);
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7'], {
      queryParams: { resultado: 'reasignada' },
    });
  });

  it('error del backend se muestra literal en submit-error y no navega', async () => {
    serviceMock.reassign.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { message: 'El técnico no está activo' } }))
    );
    await setup();
    typeTechnician('12');
    click('confirm');
    expect(de('submit-error').componentInstance.title).toBe('El técnico no está activo');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('cancelar vuelve al detalle sin reasignar', async () => {
    await setup();
    click('cancel');
    expect(serviceMock.reassign).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7']);
  });

  it('toTechnicianId solo acepta enteros positivos', () => {
    expect(toTechnicianId(12)).toBe(12);
    expect(toTechnicianId('12')).toBe(12);
    expect(toTechnicianId(null)).toBeNull();
    expect(toTechnicianId('abc')).toBeNull();
    expect(toTechnicianId(0)).toBeNull();
  });
});
