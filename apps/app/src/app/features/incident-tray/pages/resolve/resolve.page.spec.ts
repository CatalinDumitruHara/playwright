import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { IncidentTrayService } from '../../incident-tray.service';
import { TrayIncidentDetail } from '../../incident-tray.models';
import { ResolveIncidentPage, MSG_RESOLVE_NOTE_LENGTH } from './resolve.page';

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

describe('ResolveIncidentPage', () => {
  let fixture: ComponentFixture<ResolveIncidentPage>;
  let router: Router;
  let serviceMock: { detail: jest.Mock; transition: jest.Mock; release: jest.Mock; reassign: jest.Mock; history: jest.Mock };

  const de = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const click = (id: string) => {
    (de(id).nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
  };
  const typeNote = (value: string) => {
    const ta = de('note-input').nativeElement as HTMLTextAreaElement;
    ta.value = value;
    ta.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ResolveIncidentPage],
      providers: [
        provideRouter([]),
        { provide: IncidentTrayService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ResolveIncidentPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = {
      detail: jest.fn().mockReturnValue(of(DETAIL)),
      transition: jest.fn().mockReturnValue(of({ ...DETAIL, status: 'RESUELTA' })),
      release: jest.fn(),
      reassign: jest.fn(),
      history: jest.fn(),
    };
  });

  afterEach(() => jest.restoreAllMocks());

  it('confirmar con nota transiciona a RESUELTA con la nota y navega con resultado=resuelta', async () => {
    await setup();
    expect(serviceMock.detail).toHaveBeenCalledWith('7');
    typeNote('nota');
    expect(de('note-counter').nativeElement.textContent.trim()).toBe('4/500');
    click('confirm');
    expect(serviceMock.transition).toHaveBeenCalledWith('7', 'RESUELTA', 'nota');
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7'], {
      queryParams: { resultado: 'resuelta' },
    });
  });

  it('confirmar sin nota transiciona a RESUELTA sin comentario', async () => {
    await setup();
    click('confirm');
    expect(serviceMock.transition).toHaveBeenCalledWith('7', 'RESUELTA', undefined);
  });

  it('nota de 501 caracteres muestra «El comentario supera los 500 caracteres» y no transiciona', async () => {
    await setup();
    typeNote('x'.repeat(501));
    expect(MSG_RESOLVE_NOTE_LENGTH).toBe('El comentario supera los 500 caracteres');
    expect(de('form-error').nativeElement.textContent.trim()).toBe('El comentario supera los 500 caracteres');
    click('confirm');
    expect(serviceMock.transition).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('nota de 500 caracteres es válida', async () => {
    await setup();
    typeNote('x'.repeat(500));
    expect(de('form-error')).toBeNull();
    click('confirm');
    expect(serviceMock.transition).toHaveBeenCalledWith('7', 'RESUELTA', 'x'.repeat(500));
  });

  it('error del backend se muestra literal en submit-error y no navega', async () => {
    serviceMock.transition.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { message: 'Transición no permitida' } }))
    );
    await setup();
    click('confirm');
    expect(de('submit-error').componentInstance.title).toBe('Transición no permitida');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
