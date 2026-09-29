import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bHeaderDesktopComponent,
  B2bMapfreLogoComponent,
  B2bSidebarComponent,
  B2bSidebarItemComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { SessionContext } from '@api-types';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bHeaderDesktopComponent,
    B2bMapfreLogoComponent,
    B2bSidebarComponent,
    B2bSidebarItemComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  session: SessionContext | null = null;
  filteredMenu: any[] = [];
  allMenus = [
    {
      label: 'Inicio',
      path: '/inicio',
      allowedRoles: ['ROL-001', 'ROL-002', 'ROL-003'],
    },
    {
      label: 'Mi Perfil',
      path: '/mi-perfil',
      allowedRoles: ['ROL-001', 'ROL-002', 'ROL-003'],
    },
    {
      label: 'Incidencias',
      path: '/incidents',
      allowedRoles: ['ROL-002'],
    },
    {
      label: 'Admin',
      path: '/admin',
      allowedRoles: ['ROL-003'],
    },
    {
      label: 'Credencial Caducada',
      path: '/acceso/credencial-caducada',
      allowedRoles: ['ROL-001', 'ROL-002', 'ROL-003'],
    },
    {
      label: 'Permisos Actualizados',
      path: '/avisos/permisos-actualizados',
      allowedRoles: ['ROL-001', 'ROL-002', 'ROL-003'],
    },
    {
      label: 'Versión no Soportada',
      path: '/avisos/version-no-soportada',
      allowedRoles: ['ROL-001', 'ROL-002', 'ROL-003'],
    },
  ];

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.session = this.authService.sessionContext();
    this.filterMenu();
  }

  filterMenu(): void {
    const userRole = this.session?.user.role;
    if (userRole) {
      this.filteredMenu = this.allMenus.filter(menu =>
        menu.allowedRoles.includes(userRole)
      );
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/acceso/sesion-finalizada']);
      },
      error: (error: any) => {
        console.error('Error al cerrar sesión', error);
      },
    });
  }
}
