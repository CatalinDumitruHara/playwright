import { signal, WritableSignal, Component, Input } from '@angular/core';
import { byText, createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { SessionContext } from '@api-types';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { MainLayoutComponent } from './main-layout.component';
import {
  B2bHeaderDesktopComponent,
  B2bMapfreLogoComponent,
  B2bSidebarComponent,
  B2bSidebarItemComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-home',
  template: '<h1>Home</h1>',
  standalone: true,
})
class HomeComponent {}

@Component({
  selector: 'b2b-header-desktop',
  template: '<ng-content select="[b2b-header-logo]"></ng-content><ng-content select="[b2b-header-functions]"></ng-content>',
  standalone: true,
})
class MockB2bHeaderDesktopComponent {}

@Component({
  selector: 'b2b-sidebar',
  template: '<ng-content></ng-content>',
  standalone: true,
})
class MockB2bSidebarComponent {}

@Component({
  selector: 'b2b-sidebar-item',
  template: '<ng-content></ng-content>',
  standalone: true,
})
class MockB2bSidebarItemComponent {
  @Input() icon?: string;
}



describe('MainLayoutComponent', () => {
  let spectator: Spectator<MainLayoutComponent>;
  let authenticationServiceMock: {
    sessionContext: WritableSignal<SessionContext | null>;
    logout: jest.Mock;
  };

  const createComponent = createRoutingFactory({
    component: MainLayoutComponent,
    imports: [
      B2bHeaderDesktopComponent,
      B2bSidebarComponent,
      B2bSidebarItemComponent,
      B2bMapfreLogoComponent,
    ],
    mocks: [AuthenticationService],
    routes: [{ path: 'home', component: HomeComponent }],
  });

  beforeEach(() => {
    authenticationServiceMock = {
      sessionContext: signal(null),
      logout: jest.fn(),
    };
    spectator = createComponent({
      providers: [{ provide: AuthenticationService, useValue: authenticationServiceMock }],
    });
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should display user name when authenticated', () => {
    const session: SessionContext = {
      session: { user: { name: 'John Doe', role: 'user' } },
      token: 'test_token',
    };
    authenticationServiceMock.sessionContext.set(session);
    spectator.detectChanges();
    expect(spectator.query('.user-info span')).toHaveText('John Doe');
  });

  it('should display menu options based on user role', () => {
    const session: SessionContext = {
      session: { user: { name: 'John Doe', role: 'user' } },
      token: 'test_token',
    };
    authenticationServiceMock.sessionContext.set(session);
    spectator.detectChanges();

    const menuItems = spectator.queryAll('b2b-sidebar-item');
    expect(menuItems).toHaveLength(2);
    expect(spectator.query(byText('Inicio'))).toBeTruthy();
    expect(spectator.query(byText('Gestión de Incidencias'))).toBeTruthy();
  });

  it('should call logout when logout button is clicked', () => {
    const session: SessionContext = {
      session: { user: { name: 'John Doe', role: 'user' } },
      token: 'test_token',
    };
    authenticationServiceMock.sessionContext.set(session);
    spectator.detectChanges();

    const logoutButton = spectator.query(byText('Cerrar sesión'));
    expect(logoutButton).toBeTruthy();
    spectator.click(logoutButton as Element);

    expect(authenticationServiceMock.logout).toHaveBeenCalled();
  });
});
