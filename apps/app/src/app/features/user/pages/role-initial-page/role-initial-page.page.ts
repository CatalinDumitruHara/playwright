import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  B2bContainerComponent,
  B2bHeaderDesktopComponent,
  B2bMapfreLogoComponent,
  B2bButtonComponent,
  B2bGridLayoutComponent,
  B2bSidebarComponent,
  B2bSidebarItemComponent,
  B2bLinkComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-role-initial-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bContainerComponent,
    B2bHeaderDesktopComponent,
    B2bMapfreLogoComponent,
    B2bButtonComponent,
    B2bGridLayoutComponent,
    B2bSidebarComponent,
    B2bSidebarItemComponent,
    B2bLinkComponent,
  ],
  templateUrl: './role-initial-page.page.html',
  styleUrl: './role-initial-page.page.scss',
})
export class RoleInitialPage {
  userName = 'Usuario de prueba';
  userRole = 'Administrador';

  menuItems = [
    { label: 'Inicio', path: '/inicio' },
    { label: 'Mi perfil', path: '/mi-perfil' },
  ];

  shortcutItems = [
    { label: 'Crear incidencia', path: '/incidencias/crear' },
    { label: 'Ver incidencias', path: '/incidencias' },
  ];

  logout() {
    // Lógica para cerrar sesión
  }
}
