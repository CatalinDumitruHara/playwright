
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { MainLayoutComponent } from './main-layout.component';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { SessionContext } from '@api-types';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  async function configureTestBed(session: SessionContext | null) {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent, RouterTestingModule],
      providers: [
        {
          provide: AuthenticationService,
          useValue: {
            get currentSession() {
              return session;
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA], // Ignorar componentes desconocidos como b2b-sidebar-item
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
  }

  it('should create', async () => {
    await configureTestBed(null);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('when user is not authenticated', () => {
    beforeEach(async () => {
      await configureTestBed(null);
      fixture.detectChanges();
    });

    it('should show no menu options', () => {
      const menuItems = fixture.debugElement.queryAll(By.css('b2b-sidebar-item'));
      expect(component.menuOptions.length).toBe(0);
      expect(menuItems.length).toBe(0);
    });
  });

  describe('when user has "user" role', () => {
    beforeEach(async () => {
      const userSession: SessionContext = {
        user: { name: 'Test User', email: 'user@test.com' },
        permissions: ['user'],
      };
      await configureTestBed(userSession);
      fixture.detectChanges();
    });

    it('should only show "Inicio" menu option', () => {
      const menuItems = fixture.debugElement.queryAll(By.css('b2b-sidebar-item'));
      expect(component.menuOptions.length).toBe(1);
      expect(component.menuOptions[0].label).toBe('Inicio');
    });
  });

  describe('when user has "admin" role', () => {
    beforeEach(async () => {
      const adminSession: SessionContext = {
        user: { name: 'Admin User', email: 'admin@test.com' },
        permissions: ['admin', 'user'],
      };
      await configureTestBed(adminSession);
      fixture.detectChanges();
    });

    it('should show "Inicio" and "Usuarios" menu options', () => {
      const menuItems = fixture.debugElement.queryAll(By.css('b2b-sidebar-item'));
      expect(component.menuOptions.length).toBe(2);
      expect(component.menuOptions.find(m => m.label === 'Inicio')).toBeDefined();
      expect(component.menuOptions.find(m => m.label === 'Usuarios')).toBeDefined();
    });
  });
});
