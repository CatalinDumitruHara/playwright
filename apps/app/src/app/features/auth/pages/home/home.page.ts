import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bSidebarComponent,
  B2bSidebarItemComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { SessionContext } from '@api-types';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    B2bButtonComponent,
    B2bSidebarComponent,
    B2bSidebarItemComponent,
    B2bContainerComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  user: SessionContext['user'] | null = null;

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.sessionContext()?.user ?? null;
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
