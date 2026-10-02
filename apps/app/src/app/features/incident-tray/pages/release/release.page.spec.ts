import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { IncidentTrayService } from '../../incident-tray.service';
import { TrayIncidentDetail } from '../../incident-tray.models';
import { MSG_RELEASE_REASON, ReleaseIncidentPage } from './release.page';

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

describe('ReleaseIncidentPage', () => {
  let fixture: ComponentFixture<ReleaseIncidentPage>;
  let router: Router;
  let serviceMock: { detail: jest.Mock; transition: jest.Mock; release: jest.Mock; reassign: jest.Mock; history: jest.Mock };

  const de = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const click = (id: string) => {
    (de(id).nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
  };
  const typeReason = (value: string) => {
    const ta = de('reason-input').nativeElement as HTMLTextAreaElement;
    ta.value = value;
    ta.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ReleaseIncidentPage],
      providers: [
        provideRouter([]),
        { provide: IncidentTrayService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ReleaseIncidentPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = {
      detail: jest.fn().mockReturnValue(of(DETAIL)),
      transition: jest.fn(),
      release: jest.fn().mockReturnValue(of({})),
      reassign: jest.fn(),
      history: jest.fn(),
    };
  });

  afterEach(() => jest.restoreAllMocks());

  it('AC-ASG-04: carga la incidencia y muestra el técnico asignado', async () => {
    await setup();
    expect(serviceMock.detail).toHaveBeenCalledWith('7');
    expect(de('summary-assignee').nativeElement.textContent.trim()).toBe('Luis Pérez');
    expect(de('form-error')).toBeNull();
  });

  it('AC-ASG-04: motivo de menos de 10 caracteres muestra el error y no llama a release', async () => {
    await setup();
    typeReason('corto');
    click('confirm');
    expect(de('form-error').nativeElement.textContent.trim()).toBe(
      'Indica el motivo de la liberación (mínimo 10 caracteres).'
    );
    expect(MSG_RELEASE_REASON).toBe('Indica el motivo de la liberación (mínimo 10 caracteres).');
    expect(serviceMock.release).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('AC-ASG-04: motivo vacío tras perder el foco muestra el error', async () => {
    await setup();
    (de('reason-input').nativeElement as HTMLTextAreaElement).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(de('form-error').nativeElement.textContent.trim()).toBe(MSG_RELEASE_REASON);
  });

  it('AC-ASG-04: motivo con solo espacios hasta 10 chars se considera inválido (normalización)', async () => {
    await setup();
    typeReason('  a   b    c   ');
    click('confirm');
    expect(serviceMock.release).not.toHaveBeenCalled();
    expect(de('form-error')).not.toBeNull();
  });

  it('AC-ASG-04: motivo válido llama release con el motivo y navega con resultado=liberada', async () => {
    await setup();
    typeReason('Me voy de vacaciones');
    click('confirm');
    expect(serviceMock.release).toHaveBeenCalledWith('7', 'Me voy de vacaciones');
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7'], {
      queryParams: { resultado: 'liberada' },
    });
  });

  it('error del backend se muestra literal en submit-error y no navega', async () => {
    serviceMock.release.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'La incidencia no está asignada' } }))
    );
    await setup();
    typeReason('Motivo suficientemente largo');
    click('confirm');
    expect(de('submit-error').componentInstance.title).toBe('La incidencia no está asignada');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('cancelar vuelve al detalle sin liberar', async () => {
    await setup();
    click('cancel');
    expect(serviceMock.release).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7']);
  });
});
