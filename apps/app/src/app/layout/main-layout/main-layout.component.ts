
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  B2bHeaderDesktopComponent,
  B2bSidebarComponent,
  B2bContainerComponent,
  B2bMapfreLogoComponent,
  B2bSidebarItemComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { SessionContext } from '@api-types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [
    B2bHeaderDesktopComponent,
    B2bSidebarComponent,
    B2bContainerComponent,
    B2bMapfreLogoComponent,
    B2bSidebarItemComponent,
    RouterModule,
    CommonModule,
  ],
})
export class MainLayoutComponent {
  private readonly authenticationService = inject(AuthenticationService);
  public session = this.authenticationService.sessionContext;

  public menuOptions = computed(() => {
    const allMenus = [
      {
        label: 'Inicio',
        routerLink: '/home',
        icon: 'b2b-icon-home',
        allowedRoles: ['ROL-001', 'ROL-002', 'ROL-003'],
      },
      {
        label: 'Gestión de Incidencias',
        routerLink: '/incidents',
        icon: 'b2b-icon-incident',
        allowedRoles: ['ROL-002'],
      },
      {
        label: 'Administración',
        routerLink: '/admin',
        icon: 'b2b-icon-settings',
        allowedRoles: ['ROL-003'],
      },
    ];

    const userPermissions = this.session()?.permissions;
    if (!userPermissions) {
      return [];
    }

    return allMenus.filter(menu => menu.allowedRoles.some(role => userPermissions.includes(role)));
  });

  public get userName(): string {
    return this.session()?.user.name || '';
  }

  public logout(): void {
    this.authenticationService.logout();
  }
}
