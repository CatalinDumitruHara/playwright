import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { MyIncidentsService } from '../../my-incidents.service';
import { HistoryEntry } from '../../my-incidents.models';
import { IncidentHistoryPage, formatDwell } from './incident-history.page';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const ENTRIES: HistoryEntry[] = [
  { fromStatus: null, toStatus: 'ABIERTA', actorName: 'Ana', changedAt: '2026-03-01T10:00:00', comment: null, dwellMs: 2 * HOUR },
  { fromStatus: 'ABIERTA', toStatus: 'EN_CURSO', actorName: 'Luis', changedAt: '2026-03-01T12:00:00', comment: null, dwellMs: DAY },
  { fromStatus: 'EN_CURSO', toStatus: 'RESUELTA', actorName: 'Luis', changedAt: '2026-03-02T12:00:00', comment: null, dwellMs: null },
];

describe('formatDwell', () => {
  it('null → «Estado actual»', () => expect(formatDwell(null)).toBe('Estado actual'));
  it('30 s → «menos de 1 min»', () => expect(formatDwell(30_000)).toBe('menos de 1 min'));
  it('12 min', () => expect(formatDwell(12 * MIN)).toBe('12 min'));
  it('horas + minutos', () => expect(formatDwell(3 * HOUR + 15 * MIN)).toBe('3 h 15 min'));
  it('horas exactas', () => expect(formatDwell(2 * HOUR)).toBe('2 h'));
  it('días + horas', () => expect(formatDwell(2 * DAY + 3 * HOUR + 10 * MIN)).toBe('2 d 3 h'));
  it('días exactos', () => expect(formatDwell(DAY)).toBe('1 d'));
});

describe('IncidentHistoryPage', () => {
  let fixture: ComponentFixture<IncidentHistoryPage>;
  let component: IncidentHistoryPage;
  let serviceMock: { history: jest.Mock };
  let router: Router;

  const all = (id: string) => fixture.debugElement.queryAll(By.css(`[data-testid="${id}"]`));
  const one = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [IncidentHistoryPage],
      providers: [
        provideRouter([]),
        { provide: MyIncidentsService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(IncidentHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = { history: jest.fn() };
  });

  it('AC: con 3 entradas pinta 3 history-entry y la primera tiene origen «Alta»', async () => {
    serviceMock.history.mockReturnValue(of(ENTRIES));
    await setup();
    expect(serviceMock.history).toHaveBeenCalledWith('7');
    const entries = all('history-entry');
    expect(entries.length).toBe(3);
    expect(all('history-from')[0].nativeElement.textContent.trim()).toBe('Alta');
    expect(all('history-from')[1].nativeElement.textContent.trim()).toBe('Abierta');
    expect(all('history-dwell')[2].nativeElement.textContent.trim()).toBe('Estado actual');
  });

  it('AC: filtrar por estado destino reduce las entradas', async () => {
    serviceMock.history.mockReturnValue(of(ENTRIES));
    await setup();
    component.onFilterChange('RESUELTA');
    fixture.detectChanges();
    expect(all('history-entry').length).toBe(1);
    expect(all('history-to')[0].nativeElement.textContent.trim()).toBe('Resuelta');
    component.onFilterChange({ code: 'TODOS', label: 'Todos' });
    fixture.detectChanges();
    expect(all('history-entry').length).toBe(3);
  });

  it('AC: sin entradas muestra «No hay cambios de estado registrados»', async () => {
    serviceMock.history.mockReturnValue(of([]));
    await setup();
    expect(all('history-entry').length).toBe(0);
    const empty = one('history-empty');
    expect(empty).toBeTruthy();
    expect(empty.componentInstance.title).toBe('No hay cambios de estado registrados');
  });

  it('Error: 404 navega a /incidencias/no-encontrada con el id', async () => {
    serviceMock.history.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    await setup();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias/no-encontrada'], { queryParams: { id: '7' } });
  });

  it('Error: 500 muestra aviso de error sin navegar', async () => {
    serviceMock.history.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await setup();
    expect(one('history-error')).toBeTruthy();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
