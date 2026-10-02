import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { IncidentTrayService } from '../../incident-tray.service';
import { TrayHistoryEntry } from '../../incident-tray.models';
import { AssignmentHistoryPage, LOAD_ERROR_FALLBACK } from './assignment-history.page';

const ENTRIES: TrayHistoryEntry[] = [
  {
    entryType: 'ASIGNACION',
    fromStatus: null,
    toStatus: null,
    fromTechnicianName: null,
    toTechnicianName: 'Luis Pérez',
    actorName: 'Luis Pérez',
    changedAt: '2026-09-01T09:30:00',
    reason: null,
  },
  {
    entryType: 'LIBERACION',
    fromStatus: null,
    toStatus: null,
    fromTechnicianName: 'Luis Pérez',
    toTechnicianName: null,
    actorName: 'Luis Pérez',
    changedAt: '2026-09-02T10:00:00',
    reason: 'Me voy de vacaciones',
  },
  {
    entryType: 'REASIGNACION',
    fromStatus: null,
    toStatus: null,
    fromTechnicianName: null,
    toTechnicianName: 'Marta Ruiz',
    actorName: 'Admin',
    changedAt: '2026-09-03T11:00:00',
    reason: null,
  },
];

describe('AssignmentHistoryPage', () => {
  let fixture: ComponentFixture<AssignmentHistoryPage>;
  let router: Router;
  let serviceMock: { detail: jest.Mock; transition: jest.Mock; release: jest.Mock; reassign: jest.Mock; history: jest.Mock };

  const de = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const entries = () => fixture.debugElement.queryAll(By.css('[data-testid="ah-entry"]'));
  const entryTitles = () => entries().map((e) => e.nativeElement.getAttribute('title') ?? e.componentInstance?.title);

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [AssignmentHistoryPage],
      providers: [
        provideRouter([]),
        { provide: IncidentTrayService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AssignmentHistoryPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = {
      detail: jest.fn(),
      transition: jest.fn(),
      release: jest.fn(),
      reassign: jest.fn(),
      history: jest.fn().mockReturnValue(of(ENTRIES)),
    };
  });

  afterEach(() => jest.restoreAllMocks());

  it('pinta un ah-entry por cada entrada del historial', async () => {
    await setup();
    expect(serviceMock.history).toHaveBeenCalledWith('7');
    expect(entries().length).toBe(3);
    expect(de('ah-empty').componentInstance.visible).toBe(false);
    const titles = entryTitles();
    expect(titles[0]).toContain('Asignación');
    expect(titles[1]).toContain('Liberación');
    expect(titles[1]).toContain('Motivo: Me voy de vacaciones');
    expect(titles[2]).toContain('Reasignación');
  });

  it('filtrar por tipo LIBERACION reduce las entradas a las de liberación', async () => {
    await setup();
    de('ah-filter').triggerEventHandler('selectionChange', 'LIBERACION');
    fixture.detectChanges();
    expect(entries().length).toBe(1);
    expect(entryTitles()[0]).toContain('Liberación');

    de('ah-filter').triggerEventHandler('selectionChange', { code: 'TODAS', label: 'Todas' });
    fixture.detectChanges();
    expect(entries().length).toBe(3);
  });

  it('sin entradas muestra ah-empty visible y ningún ah-entry', async () => {
    serviceMock.history.mockReturnValue(of([]));
    await setup();
    expect(entries().length).toBe(0);
    const empty = de('ah-empty');
    expect(empty.componentInstance.visible).toBe(true);
    expect(empty.componentInstance.title).toBe('No hay entradas de responsabilidad para esta incidencia');
  });

  it('error de carga muestra load-error y no el aviso de vacío', async () => {
    serviceMock.history.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await setup();
    expect(de('load-error').componentInstance.visible).toBe(true);
    expect(de('load-error').componentInstance.title).toBe(LOAD_ERROR_FALLBACK);
    expect(de('ah-empty').componentInstance.visible).toBe(false);
  });

  it('volver navega al detalle de la incidencia', async () => {
    await setup();
    (de('back-to-detail').nativeElement as HTMLButtonElement).click();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias', '7']);
  });
});
