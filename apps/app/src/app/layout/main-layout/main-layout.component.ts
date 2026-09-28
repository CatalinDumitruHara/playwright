
import { Component, inject } from '@angular/core';
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
  public session: SessionContext | null;
  public menuOptions: any[] = [];

  private readonly authenticationService = inject(AuthenticationService);

  constructor() {
    this.session = this.authenticationService.currentSession;
    this.buildMenu();
  }

  private buildMenu(): void {
    const allMenus = [
      {
        label: 'Inicio',
        routerLink: '/home',
        icon: 'b2b-icon-home',
        requiredPermission: 'user', // O cualquier otro permiso base
      },
      {
        label: 'Usuarios',
        routerLink: '/users',
        icon: 'b2b-icon-users',
        requiredPermission: 'admin',
      },
    ];

    const userPermissions = this.session?.permissions ?? [];
    this.menuOptions = allMenus.filter(menu => userPermissions.includes(menu.requiredPermission));
  }
}
