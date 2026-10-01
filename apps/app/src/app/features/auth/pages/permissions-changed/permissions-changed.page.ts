import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

@Component({
  selector: 'app-permissions-changed',
  templateUrl: './permissions-changed.page.html',
  styleUrls: ['./permissions-changed.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bButtonComponent,
  ],
})
export class PermissionsChangedPage {
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly reloading = signal(false);

  /** Re-resolves the session context (EP-003) so menu and actions reflect the new role. */
  reloadMenu(): void {
    if (this.reloading()) {
      return;
    }
    this.reloading.set(true);
    this.auth.getSessionContext().subscribe({
      next: (u) => {
        this.reloading.set(false);
        void this.router.navigate(u ? ['/inicio'] : ['/acceso']);
      },
      error: () => {
        this.reloading.set(false);
      },
    });
  }
}
