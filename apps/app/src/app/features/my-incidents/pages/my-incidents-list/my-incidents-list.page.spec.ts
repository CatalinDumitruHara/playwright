import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router, convertToParamMap, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MyIncidentsService } from '../../my-incidents.service';
import { IncidentPage, IncidentRow } from '../../my-incidents.models';
import { ReportIncidentService } from '../../../report-incident/report-incident.service';
import { CATALOG_ERROR, DATE_RANGE_ERROR, LIST_ERROR, MyIncidentsListPage, SEARCH_ERROR } from './my-incidents-list.page';

const ROW: IncidentRow = {
  incidentId: 'inc-1',
  referenceCode: 'INC-0001',
  roomName: 'Sala Norte',
  officeName: 'Madrid',
  categoryName: 'Climatización',
  description: 'No funciona el aire',
  statusCode: 'ABIERTA',
  createdAt: '2026-09-01T10:00:00',
  updatedAt: null,
  assignedTechnicianName: null,
};

const page = (items: IncidentRow[], total = items.length): IncidentPage => ({
  items,
  total,
  page: 1,
  pageSize: 20,
});

describe('MyIncidentsListPage', () => {
  let fixture: ComponentFixture<MyIncidentsListPage>;
  let component: MyIncidentsListPage;
  let router: Router;
  let navigateSpy: jest.SpyInstance;
  let myIncidentsMock: { list: jest.Mock };
  let reportMock: { loadCategories: jest.Mock; loadRooms: jest.Mock };

  const el = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const all = (id: string) => fixture.debugElement.queryAll(By.css(`[data-testid="${id}"]`));
  const text = (id: string): string => (el(id)?.nativeElement.textContent ?? '').trim();

  async function setup(params: Params = {}): Promise<void> {
    const paramMap$ = new BehaviorSubject(convertToParamMap(params));
    const routeMock = {
      queryParamMap: paramMap$.asObservable(),
      snapshot: { queryParamMap: convertToParamMap(params) },
    };
    await TestBed.configureTestingModule({
      imports: [MyIncidentsListPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: MyIncidentsService, useValue: myIncidentsMock },
        { provide: ReportIncidentService, useValue: reportMock },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(MyIncidentsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    myIncidentsMock = { list: jest.fn().mockReturnValue(of(page([ROW]))) };
    reportMock = {
      loadCategories: jest.fn().mockReturnValue(of([])),
      loadRooms: jest.fn().mockReturnValue(of([])),
    };
  });

  it('AC1: llama list() sin identidad de usuario y pinta filas con estado legible, «Sin asignar» y total', async () => {
    await setup();
    expect(myIncidentsMock.list).toHaveBeenCalledTimes(1);
    const query = myIncidentsMock.list.mock.calls[0][0];
    expect(query).not.toHaveProperty('reporter_user_id');
    expect(query).not.toHaveProperty('reported_by_user_id');
    expect(Object.keys(query).some((k) => /user/i.test(k))).toBe(false);

    const rows = all('incident-row');
    expect(rows).toHaveLength(1);
    const rowText = rows[0].nativeElement.textContent;
    expect(rowText).toContain('INC-0001');
    expect(rowText).toContain('Abierta');
    expect(rowText).not.toContain('ABIERTA');
    expect(rowText).toContain('Sin asignar');
    expect(text('total-count')).toBe('1 incidencia');
  });

  it('AC2: lista vacía sin filtros muestra «No tienes incidencias reportadas» y ningún error', async () => {
    myIncidentsMock.list.mockReturnValue(of(page([])));
    await setup();
    expect(el('empty-state')).toBeTruthy();
    const notification = el('empty-state').query(By.css('b2b-notification-inline'));
    expect(notification.componentInstance.title).toBe('No tienes incidencias reportadas');
    expect(el('list-error')).toBeNull();
    expect(component.listError()).toBeNull();
    expect(all('incident-row')).toHaveLength(0);
  });

  it('AC3: restaura filtros desde la URL (status_code=ABIERTA, page=2) y los pasa a list()', async () => {
    await setup({ status_code: 'ABIERTA', page: '2' });
    expect(myIncidentsMock.list).toHaveBeenCalledWith(
      expect.objectContaining({ status_code: ['ABIERTA'], page: 2 })
    );
    expect(component.form.controls.status_code.value).toEqual(['ABIERTA']);
    expect(component.currentPage()).toBe(2);
  });

  it('AC4: applyFilters() navega con queryParams y page=1; clearFilters() navega sin queryParams', async () => {
    await setup({ page: '3' });
    component.form.controls.status_code.setValue(['ABIERTA']);
    component.form.controls.search_text.setValue('aire');
    component.applyFilters();
    expect(navigateSpy).toHaveBeenCalledTimes(1);
    const [commands, extras] = navigateSpy.mock.calls[0];
    expect(commands).toEqual([]);
    expect(extras.queryParams).toEqual({ status_code: ['ABIERTA'], search_text: 'aire' });
    expect(extras.queryParams).not.toHaveProperty('page');
    expect(component.currentPage()).toBe(1);

    navigateSpy.mockClear();
    component.clearFilters();
    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy.mock.calls[0][1].queryParams).toEqual({});
  });

  it('AC5: search_text de 1 carácter no consulta y muestra el aviso de mínimo 2 caracteres', async () => {
    await setup({ search_text: 'a' });
    expect(myIncidentsMock.list).not.toHaveBeenCalled();
    expect(text('search-error')).toBe('Introduce al menos 2 caracteres para buscar');
    expect(SEARCH_ERROR).toBe('Introduce al menos 2 caracteres para buscar');

    component.form.controls.search_text.setValue('b');
    component.applyFilters();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('AC6: created_from posterior a created_to muestra error de rango y no consulta', async () => {
    await setup({ created_from: '2026-09-10', created_to: '2026-09-01' });
    expect(myIncidentsMock.list).not.toHaveBeenCalled();
    expect(text('date-error')).toBe('La fecha de inicio no puede ser posterior a la de fin');
    expect(DATE_RANGE_ERROR).toBe('La fecha de inicio no puede ser posterior a la de fin');
  });

  it('AC7: error 500 en list() muestra el mensaje de error del listado', async () => {
    myIncidentsMock.list.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
    );
    await setup();
    expect(el('list-error')).toBeTruthy();
    expect(el('list-error').componentInstance.title).toBe(
      'No se ha podido recuperar tu listado de incidencias. Inténtalo de nuevo'
    );
    expect(component.listError()).toBe(LIST_ERROR);
    expect(el('empty-state')).toBeNull();
    expect(all('incident-row')).toHaveLength(0);
  });

  it('catálogos: si loadRooms falla muestra el aviso, conserva las categorías y sigue listando', async () => {
    reportMock.loadCategories.mockReturnValue(of([{ code: 'CLIM', name: 'Climatización', active: true }]));
    reportMock.loadRooms.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
    );
    await setup();
    expect(component.catalogError()).toBe(CATALOG_ERROR);
    expect(component.catalogError()).toBe('No se han podido cargar los catálogos de filtros, reintenta');
    expect(el('catalog-error').componentInstance.title).toBe(CATALOG_ERROR);
    expect(component.categoryOptions()).toEqual([{ value: 'CLIM', label: 'Climatización' }]);
    expect(component.roomOptions()).toEqual([]);
    expect(all('incident-row')).toHaveLength(1);
  });

  it('catálogos: sin errores no hay aviso de catálogos', async () => {
    await setup();
    expect(component.catalogError()).toBeNull();
  });

  it('AC8: el enlace de detalle apunta a /mis-incidencias/<id>', async () => {
    await setup();
    const link = el('incident-detail-link');
    expect(link.nativeElement.getAttribute('href')).toBe('/mis-incidencias/inc-1');
  });
});
