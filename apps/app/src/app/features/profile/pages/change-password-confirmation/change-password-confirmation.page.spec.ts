import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordConfirmationPage } from './change-password-confirmation.page';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { formatDate } from '@angular/common';

describe('ChangePasswordConfirmationPage', () => {
  let component: ChangePasswordConfirmationPage;
  let fixture: ComponentFixture<ChangePasswordConfirmationPage>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChangePasswordConfirmationPage,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([{ path: 'mi-perfil', redirectTo: '' }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordConfirmationPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the success message', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('¡Contraseña actualizada!');
  });

  it('should display the date and time of the change', () => {
    const p = fixture.nativeElement.querySelector('p');
    const formattedTime = formatDate(component.changeDateTime, 'HH:mm', 'en-US');
    const formattedDate = formatDate(component.changeDateTime, 'dd/MM/yyyy', 'en-US');
    expect(p.textContent).toContain(`Tu contraseña ha sido cambiada con éxito a las ${formattedTime} del ${formattedDate}.`);
  });

  it('should display the session revocation notice', () => {
    const alert = fixture.nativeElement.querySelector('.alert-info p');
    expect(alert.textContent).toContain('Por tu seguridad, hemos cerrado todas las demás sesiones activas en otros dispositivos.');
  });

  it('should navigate to "Mi perfil" when the button is clicked', () => {
    const button = fixture.debugElement.query(By.css('.btn-primary'));
    expect(button.nativeElement.getAttribute('href')).toBe('/mi-perfil');
  });
});
