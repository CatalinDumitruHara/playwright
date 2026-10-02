import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router, convertToParamMap, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { IncidentTrayService } from '../../incident-tray.service';
import { TrayPage, TrayRow } from '../../incident-tray.models';
import { ReportIncidentService } from '../../../report-incident/report-incident.service';
import {
  IncidentTrayPage,
  TRAY_DATE_ORDER_ERROR,
  TRAY_EMPTY_MESSAGE,
  TRAY_LIST_ERROR,
  TRAY_SEARCH_HINT,
} from './incident-tray.page';

const row = (over: Partial<TrayRow> = {}): TrayRow => ({
  incidentId: 'inc-1',
  incidentCode: 'INC-0001',
  roomName: 'Sala Norte',
  officeName: 'Madrid',
  categoryName: 'Climatización',
  status: 'ABIERTA',
  createdAt: '2026-09-01T10:00:00',
  updatedAt: null,
  ageDays: 3,
  reporterName: 'Ana Pérez',
  assignedTechnicianName: null,
  hasPhoto: false,
  ...over,
});

const page = (items: TrayRow[], totalCount = items.length): TrayPage => ({
  items,
  totalCount,
  page: 1,
  pageSize: 25,
  totalPages: 1,
});

describe('IncidentTrayPage', () => {
  let fixture: ComponentFixture<IncidentTrayPage>;
  let component: IncidentTrayPage;
  let navigateSpy: jest.SpyInstance;
  let trayMock: { list: jest.Mock };
  let reportMock: { loadCategories: jest.Mock; loadRooms: jest.Mock };

  const el = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const all = (id: string) => fixture.debugElement.queryAll(By.css(`[data-testid="${id}"]`));
  const text = (id: string): string => (el(id)?.nativeElement.textContent ?? '').trim();
  const notif = (id: string) => el(id).componentInstance as { title: string; visible: boolean };

  async function setup(params: Params = {}): Promise<void> {
    const paramMap$ = new BehaviorSubject(convertToParamMap(params));
    const routeMock = {
      queryParamMap: paramMap$.asObservable(),
      snapshot: { queryParamMap: convertToParamMap(params) },
    };
    await TestBed.configureTestingModule({
      imports: [IncidentTrayPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: IncidentTrayService, useValue: trayMock },
        { provide: ReportIncidentService, useValue: reportMock },
      ],
    }).compileComponents();
    navigateSpy = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(IncidentTrayPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    trayMock = {
      list: jest
        .fn()
        .mockReturnValue(
          of(page([row(), row({ incidentId: 'inc-2', incidentCode: 'INC-0002', assignedTechnicianName: 'Luis Gómez' })], 2))
        ),
    };
    reportMock = {
      loadCategories: jest.fn().mockReturnValue(of([])),
      loadRooms: jest.fn().mockReturnValue(of([])),
    };
  });

  it('AC-BAN-01: sin queryParams llama list con valores por defecto, pinta filas, «Sin asignar» y total', async () => {
    await setup();
    expect(trayMock.list).toHaveBeenCalledTimes(1);
    expect(trayMock.list).toHaveBeenCalledWith({
      sort_by: 'created_at',
      sort_dir: 'DESC',
      page: 1,
      page_size: 25,
    });
    const rows = all('tray-row');
    expect(rows).toHaveLength(2);
    const assignees = all('tray-assignee').map((d) => d.nativeElement.textContent.trim());
    expect(assignees).toEqual(['Sin asignar', 'Luis Gómez']);
    expect(text('tray-count')).toBe('2 incidencias encontradas');
  });

  it('AC-BAN-06: reconstruye el estado de vista desde la URL y lo pasa a list', async () => {
    await setup({ status: 'ABIERTA', assignment_filter: 'SIN_ASIGNAR', page: '2' });
    expect(trayMock.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: ['ABIERTA'], assignment_filter: 'SIN_ASIGNAR', page: 2 })
    );
    expect(component.form.controls.status.value).toEqual(['ABIERTA']);
    expect(component.form.controls.assignment_filter.value).toBe('SIN_ASIGNAR');
    expect(component.currentPage()).toBe(2);
  });

  it('AC-BAN-06 vacío: 0 resultados muestra tray-empty con el mensaje y mantiene los filtros', async () => {
    trayMock.list.mockReturnValue(of(page([])));
    await setup({ status: 'CERRADA' });
    expect(el('tray-empty')).toBeTruthy();
    const empty = el('tray-empty').query(By.css('b2b-notification-inline'));
    expect(empty.componentInstance.title).toBe(TRAY_EMPTY_MESSAGE);
    expect(TRAY_EMPTY_MESSAGE).toBe('No hay incidencias que cumplan los filtros seleccionados');
    expect(all('tray-row')).toHaveLength(0);
    expect(el('tray-filter-status')).toBeTruthy();
    expect(el('tray-search')).toBeTruthy();
    expect(component.form.controls.status.value).toEqual(['CERRADA']);
  });

  it('AC-BAN-05: fecha desde > hasta muestra tray-date-error y no vuelve a llamar a list (lista previa visible)', async () => {
    await setup();
    expect(trayMock.list).toHaveBeenCalledTimes(1);
    component.form.patchValue({ created_from: '2026-09-10', created_to: '2026-09-01' });
    component.applyFilters();
    fixture.detectChanges();
    expect(notif('tray-date-error').visible).toBe(true);
    expect(notif('tray-date-error').title).toBe(TRAY_DATE_ORDER_ERROR);
    expect(TRAY_DATE_ORDER_ERROR).toBe('La fecha de inicio no puede ser posterior a la de fin');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(trayMock.list).toHaveBeenCalledTimes(1);
    expect(all('tray-row')).toHaveLength(2);
  });

  it('AC-BAN-05 (URL): rango invertido en la URL no consulta', async () => {
    await setup({ created_from: '2026-09-10', created_to: '2026-09-01' });
    fixture.detectChanges();
    expect(trayMock.list).not.toHaveBeenCalled();
    expect(notif('tray-date-error').title).toBe(TRAY_DATE_ORDER_ERROR);
  });

  it('AC-BAN-07: búsqueda de 2 caracteres muestra aviso y no envía search_text', async () => {
    await setup({ search_text: 'ab' });
    fixture.detectChanges();
    expect(notif('tray-search-hint').visible).toBe(true);
    expect(notif('tray-search-hint').title).toBe(TRAY_SEARCH_HINT);
    expect(TRAY_SEARCH_HINT).toBe('Introduce al menos 3 caracteres');
    expect(trayMock.list).toHaveBeenCalledTimes(1);
    expect(trayMock.list.mock.calls[0][0]).not.toHaveProperty('search_text');
  });

  it('AC-BAN-07: con 3 o más caracteres sí se envía search_text y no hay aviso', async () => {
    await setup({ search_text: 'aire' });
    fixture.detectChanges();
    expect(notif('tray-search-hint').visible).toBe(false);
    expect(trayMock.list).toHaveBeenCalledWith(expect.objectContaining({ search_text: 'aire' }));
  });

  it('Error: list falla con HttpErrorResponse 500 → tray-error visible con mensaje', async () => {
    trayMock.list.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
    );
    await setup();
    fixture.detectChanges();
    expect(notif('tray-error').visible).toBe(true);
    expect(notif('tray-error').title).toBe(TRAY_LIST_ERROR);
    expect(el('tray-table')).toBeNull();
    expect(el('tray-empty')).toBeNull();
  });

  it('applyFilters navega con router.navigate([], { queryParams }) con los filtros y página 1', async () => {
    await setup({ page: '3' });
    component.form.patchValue({
      status: ['ABIERTA'],
      assignment_filter: 'SIN_ASIGNAR',
      search_text: 'aire',
      created_from: '2026-09-01',
      created_to: '2026-09-10',
    });
    component.applyFilters();
    expect(navigateSpy).toHaveBeenCalledTimes(1);
    const [commands, extras] = navigateSpy.mock.calls[0];
    expect(commands).toEqual([]);
    expect(extras.queryParams).toEqual({
      status: ['ABIERTA'],
      assignment_filter: 'SIN_ASIGNAR',
      search_text: 'aire',
      created_from: '2026-09-01',
      created_to: '2026-09-10',
    });
    expect(extras.queryParams).not.toHaveProperty('page');
  });
});
