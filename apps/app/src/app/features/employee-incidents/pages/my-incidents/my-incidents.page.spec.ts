import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { MtAlertModule } from '@mapfre-tech/b2b-components/alert';
import { MtSpinnerModule } from '@mapfre-tech/b2b-components/spinner';
import { MtTableModule } from '@mapfre-tech/b2b-components/table';
import { Subject } from 'rxjs';
import { Incident } from '../../models/incident.model';
import { IncidentService } from '../../services/incident.service';
import { MyIncidentsPage } from './my-incidents.page';
import { CommonModule } from '@angular/common';

const MOCK_INCIDENTS: Incident[] = [
  { id: '1', description: 'Incident 1', status: 'open', priority: 'high' },
  { id: '2', description: 'Incident 2', status: 'closed', priority: 'low' },
];

describe('MyIncidentsPage', () => {
  let component: MyIncidentsPage;
  let fixture: ComponentFixture<MyIncidentsPage>;
  let incidentService: Partial<IncidentService>;
  let incidents$: Subject<Incident[]>;

  beforeEach(async () => {
    incidents$ = new Subject<Incident[]>();
    incidentService = {
      getMyIncidents: jest.fn(() => incidents$.asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterModule.forRoot([]),
        MtSpinnerModule,
        MtTableModule,
        MtAlertModule,
        MyIncidentsPage,
      ],
      providers: [{ provide: IncidentService, useValue: incidentService }],
    }).compileComponents();
  });

  function createComponent() {
    fixture = TestBed.createComponent(MyIncidentsPage);
    component = fixture.componentInstance;
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should show spinner while loading', () => {
    createComponent();
    fixture.detectChanges(); // ngOnInit() is called

    expect(component.loading).toBe(true);

    const spinner = fixture.debugElement.query(By.css('mt-spinner'));
    expect(spinner).toBeTruthy();

    const table = fixture.debugElement.query(By.css('[mt-table-container]'));
    expect(table).toBeFalsy();
  });

  it('should show table with data on successful API call', fakeAsync(() => {
    createComponent();
    fixture.detectChanges(); // ngOnInit() subscribes to incidents$

    incidents$.next(MOCK_INCIDENTS);
    tick();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.error).toBe(false);

    const spinner = fixture.debugElement.query(By.css('mt-spinner'));
    expect(spinner).toBeFalsy();

    const table = fixture.debugElement.query(By.css('[mt-table-container]'));
    expect(table).toBeTruthy();
  }));

  it('should show empty state message when API returns no incidents', fakeAsync(() => {
    createComponent();
    fixture.detectChanges();

    incidents$.next([]);
    tick();
    fixture.detectChanges();

    expect(component.loading).toBe(false);

    const emptyState = fixture.debugElement.query(
      By.css('mt-alert[message="No se han encontrado incidencias."]')
    );
    expect(emptyState).toBeTruthy();

    const table = fixture.debugElement.query(By.css('[mt-table-container]'));
    expect(table).toBeFalsy();
  }));

  it('should show error message on API call failure', fakeAsync(() => {
    createComponent();
    fixture.detectChanges();

    incidents$.error(new Error('API Error'));
    tick();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.error).toBe(true);

    const errorNotification = fixture.debugElement.query(
      By.css('mt-alert[message="Error al cargar las incidencias. Por favor, inténtelo de nuevo más tarde."]')
    );
    expect(errorNotification).toBeTruthy();

    const table = fixture.debugElement.query(By.css('[mt-table-container]'));
    expect(table).toBeFalsy();
  }));
});
