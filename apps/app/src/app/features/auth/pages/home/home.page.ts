import { B2bSidebarItemComponent } from '@mapfre-tech/b2b-components';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { Observable, map } from 'rxjs';
import { SessionContext } from '../../../../core/auth/authentication.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, B2bSidebarItemComponent],
})
export class HomePage implements OnInit {
  user$!: Observable<SessionContext['user'] | undefined>;
  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user$ = this.authService.getSessionContext().pipe(map(context => context?.user));
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
