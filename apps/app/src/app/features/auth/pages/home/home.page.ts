import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bHeaderDesktopComponent,
  B2bSidebarComponent,
  B2bSidebarItemComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

interface NavigationItem {
  id: string;
  text: string;
  icon: string;
  link: string;
  roles: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bHeaderDesktopComponent,
    B2bSidebarComponent,
    B2bSidebarItemComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  private authService = inject(AuthenticationService);
  private router = inject(Router);

  navigationItems: NavigationItem[] = [
    {
      id: 'item-1',
      text: 'Opción 1',
      icon: 'b2b-icon-apps',
      link: '/ruta-1',
      roles: ['admin', 'user'],
    },
    {
      id: 'item-2',
      text: 'Opción 2',
      icon: 'b2b-icon-search',
      link: '/ruta-2',
      roles: ['admin'],
    },
  ];

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/acceso/sesion-finalizada']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
