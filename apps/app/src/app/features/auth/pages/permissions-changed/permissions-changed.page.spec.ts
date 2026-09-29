
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';

import { PermissionsChangedPage } from './permissions-changed.page';

describe('PermissionsChangedPage', () => {
  let component: PermissionsChangedPage;
  let fixture: ComponentFixture<PermissionsChangedPage>;
  let router: Router;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PermissionsChangedPage ],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule.withRoutes([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionsChangedPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the permissions changed message', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('Tus permisos han cambiado');
    const paragraph = compiled.querySelector('p');
    expect(paragraph.textContent).toContain('Hemos detectado que tus permisos de acceso han sido actualizados.');
  });

  it('should display the updated role', () => {
    component.currentRole = 'ADMIN'; // Asignar un valor para la prueba
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const roleElement = compiled.querySelector('strong');
    expect(roleElement.textContent).toContain('ADMIN');
  });

  it('should navigate to home page on reload button click', () => {
    jest.spyOn(router, 'navigate');
    const button = fixture.nativeElement.querySelector('ion-button');
    button.click();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

});
