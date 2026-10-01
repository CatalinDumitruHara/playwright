import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ExpiredCredentialPage } from './expired-credential.page';

describe('ExpiredCredentialPage', () => {
  let fixture: ComponentFixture<ExpiredCredentialPage>;
  let component: ExpiredCredentialPage;
  let router: Router;

  async function setup(state: Record<string, unknown> | null): Promise<void> {
    history.replaceState(state, '');
    await TestBed.configureTestingModule({
      imports: [ExpiredCredentialPage],
      providers: [provideRouter([])],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ExpiredCredentialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const notifications = () =>
    fixture.debugElement.queryAll(By.css('b2b-notification-inline'));

  afterEach(() => {
    history.replaceState(null, '');
  });

  it('crea el componente', async () => {
    await setup(null);
    expect(component).toBeTruthy();
  });

  it('[AC] muestra el aviso de credencial temporal caducada', async () => {
    await setup(null);
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent).toContain('Credencial temporal caducada');
    const notif = fixture.debugElement.query(By.css('[data-testid="notification"]'));
    expect(notif).toBeTruthy();
    expect(notif.componentInstance.visible).toBe(true);
    expect(notif.componentInstance.title).toContain('La credencial temporal ha caducado');
  });

  it('[AC] muestra la fecha de vencimiento si llega en el history state', async () => {
    await setup({ expirationDate: '2026-10-26T12:30:00' });
    expect(component.expirationDate).toBe('2026-10-26T12:30:00');
    const dateEl = fixture.nativeElement.querySelector('[data-testid="expiration-date"]') as HTMLElement;
    expect(dateEl).toBeTruthy();
    expect(dateEl.textContent).toContain('Fecha de vencimiento');
    expect(dateEl.textContent).toContain('26/10/2026 12:30');
  });

  it('[AC] sin fecha en el state no muestra fecha y mantiene el texto genérico', async () => {
    await setup(null);
    expect(component.expirationDate).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="expiration-date"]')).toBeNull();
    const notif = fixture.debugElement.query(By.css('[data-testid="notification"]'));
    expect(notif.componentInstance.title).toBe(
      'La credencial temporal ha caducado, solicita un nuevo restablecimiento al administrador'
    );
  });

  it('[AC] indica solicitar un nuevo restablecimiento al Administrador', async () => {
    await setup(null);
    const titles = notifications().map((n) => n.componentInstance.title as string);
    expect(titles.some((t) => t.includes('Solicita al Administrador un nuevo restablecimiento'))).toBe(true);
  });

  it('[AC] el botón "Volver al formulario de acceso" navega a /acceso', async () => {
    await setup(null);
    const btn = fixture.nativeElement.querySelector('[data-testid="back-to-login"]') as HTMLButtonElement;
    expect(btn.textContent).toContain('Volver al formulario de acceso');
    btn.click();
    expect(router.navigate).toHaveBeenCalledWith(['/acceso']);
  });
});
