import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { formatDate } from '@angular/common';
import { ChangePasswordConfirmationPage } from './change-password-confirmation.page';

const CHANGED_AT = '2026-09-30T08:45:00';

describe('ChangePasswordConfirmationPage', () => {
  let fixture: ComponentFixture<ChangePasswordConfirmationPage>;
  let component: ChangePasswordConfirmationPage;
  let router: Router;

  const byTestId = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ChangePasswordConfirmationPage],
      providers: [provideRouter([])],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ChangePasswordConfirmationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => history.replaceState(null, ''));

  it('crea el componente', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('AC: muestra el mensaje de éxito del cambio de contraseña', async () => {
    await setup();
    const el = byTestId('success-message');
    expect(el).toBeTruthy();
    expect(el.componentInstance.title).toBe('Tu contraseña se ha cambiado correctamente');
  });

  it('AC: muestra la fecha y hora del cambio recibida en el state de navegación', async () => {
    history.replaceState({ changedAt: CHANGED_AT }, '');
    await setup();
    expect(component.changeDateTime.getTime()).toBe(new Date(CHANGED_AT).getTime());
    expect(byTestId('change-datetime').nativeElement.textContent.trim()).toBe(
      formatDate(CHANGED_AT, 'dd/MM/yyyy HH:mm', 'en-US'),
    );
  });

  it('AC: muestra el aviso de revocación de las demás sesiones', async () => {
    await setup();
    const el = byTestId('sessions-revoked');
    expect(el).toBeTruthy();
    expect(el.componentInstance.title).toBe('Por tu seguridad, se han cerrado tus demás sesiones abiertas');
  });

  it('AC: el botón "Volver a Mi perfil" navega a /mi-perfil', async () => {
    await setup();
    const btn = byTestId('back-to-profile');
    expect(btn.nativeElement.textContent).toContain('Volver a Mi perfil');
    btn.nativeElement.click();
    expect(router.navigate).toHaveBeenCalledWith(['/mi-perfil']);
  });
});
