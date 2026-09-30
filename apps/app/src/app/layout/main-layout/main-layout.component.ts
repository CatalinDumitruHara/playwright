import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bFooterComponent,
  B2bHeaderDesktopComponent,
  B2bMapfreLogoComponent,
  B2bNotificationInlineComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { NavMenuComponent } from '../nav-menu/nav-menu.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavMenuComponent,
    B2bHeaderDesktopComponent,
    B2bMapfreLogoComponent,
    B2bButtonComponent,
    B2bTagComponent,
    B2bContainerComponent,
    B2bFooterComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly loggingOut = signal(false);
  readonly logoutError = signal<string | null>(null);

  logout(): void {
    if (this.loggingOut()) {
      return;
    }
    this.loggingOut.set(true);
    this.logoutError.set(null);
    this.auth.logout().subscribe({
      next: () => {
        this.loggingOut.set(false);
        void this.router.navigate(['/acceso/sesion-finalizada'], {
          state: { reason: 'logout', endedAt: new Date().toISOString() },
        });
      },
      error: () => {
        this.loggingOut.set(false);
        this.logoutError.set(
          'No ha sido posible cerrar la sesión. Inténtalo de nuevo.'
        );
      },
    });
  }
}
