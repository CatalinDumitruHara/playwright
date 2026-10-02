import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { CreatedIncident } from '../../report-incident.models';
import { ReportIncidentConfirmationPage } from './report-incident-confirmation.page';

const CREATED: CreatedIncident = {
  incidentId: '5',
  referenceCode: 'INC-2026-000005',
  status: 'ABIERTA',
  createdAt: '2026-09-01T10:00:00Z',
  photoStored: true,
};

describe('ReportIncidentConfirmationPage (ARC-024)', () => {
  let fixture: ComponentFixture<ReportIncidentConfirmationPage>;
  let component: ReportIncidentConfirmationPage;
  let router: Router;

  const el = (id: string): HTMLElement | null =>
    fixture.debugElement.query(By.css(`[data-testid="${id}"]`))?.nativeElement ?? null;
  const text = (id: string): string => (el(id)?.textContent ?? '').trim();

  async function setup(state: unknown): Promise<void> {
    window.history.replaceState(state, '');
    await TestBed.configureTestingModule({
      imports: [ReportIncidentConfirmationPage],
      providers: [provideRouter([])],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ReportIncidentConfirmationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => window.history.replaceState(null, ''));

  it('muestra código de referencia y estado «Abierta» de la incidencia creada', async () => {
    await setup({ created: CREATED });
    expect(component.hasIncident).toBe(true);
    expect(text('reference-code')).toBe('INC-2026-000005');
    expect(text('incident-status')).toBe('Abierta');
    expect(el('confirmation-ok')).not.toBeNull();
    expect(el('photo-not-stored')).toBeNull();
    expect(el('no-incident')).toBeNull();
  });

  it('el enlace de detalle apunta a /mis-incidencias/5', async () => {
    await setup({ created: CREATED });
    const link = el('incident-detail-link') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/mis-incidencias/5');
  });

  it('con photoStored=false muestra el aviso de foto no guardada', async () => {
    await setup({ created: { ...CREATED, photoStored: false } });
    const warn = el('photo-not-stored');
    expect(warn).not.toBeNull();
    expect(warn?.getAttribute('title')).toBe(
      'La incidencia se ha creado pero no hemos podido guardar la foto'
    );
  });

  it('sin estado de navegación muestra el aviso de que no hay incidencia recién registrada', async () => {
    await setup(null);
    expect(component.hasIncident).toBe(false);
    const info = el('no-incident');
    expect(info).not.toBeNull();
    expect(info?.getAttribute('title')).toBe('No hay ninguna incidencia recién registrada');
    expect(el('reference-code')).toBeNull();
    expect(el('incident-detail-link')).toBeNull();
  });

  it('con un estado inválido (sin incidentId) se trata como sin incidencia', async () => {
    await setup({ created: { ...CREATED, incidentId: '' } });
    expect(el('no-incident')).not.toBeNull();
  });

  it('registerAnother() navega a /incidencias/nueva', async () => {
    await setup({ created: CREATED });
    component.registerAnother();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias/nueva']);
  });

  it('el botón «Registrar otra incidencia» navega también sin incidencia', async () => {
    await setup(null);
    (el('register-another') as HTMLButtonElement).click();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias/nueva']);
  });
});
