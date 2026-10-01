import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
} from '@mapfre-tech/b2b-components';
import { isInternalPath } from '../../../../core/auth/session.model';

export type SessionEndReason = 'logout' | 'expired';

function toValidDate(value: unknown): Date {
  if (typeof value === 'string' && value.length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

@Component({
  selector: 'app-session-ended',
  standalone: true,
  imports: [
    DatePipe,
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bButtonComponent,
  ],
  templateUrl: './session-ended.page.html',
  styleUrls: ['./session-ended.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionEndedPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Read in a field initializer: in ngOnInit getCurrentNavigation() is already null.
  private readonly navState = (this.router.getCurrentNavigation()?.extras
    .state ??
    history.state ??
    {}) as Record<string, unknown>;

  readonly reason: SessionEndReason =
    this.navState['reason'] === 'logout' ? 'logout' : 'expired';

  readonly endedAt: Date = toValidDate(this.navState['endedAt']);

  readonly title =
    this.reason === 'logout' ? 'Sesión cerrada' : 'Sesión caducada';

  readonly message =
    this.reason === 'logout'
      ? 'Has cerrado tu sesión correctamente.'
      : 'Tu sesión ha caducado por inactividad. Vuelve a identificarte para continuar.';

  readonly returnUrl: string | null = this.resolveReturnUrl();

  goToLogin(): void {
    const returnUrl = this.returnUrl;
    void this.router.navigate(['/acceso'], {
      queryParams: returnUrl ? { returnUrl } : {},
    });
  }

  private resolveReturnUrl(): string | null {
    const raw = this.route.snapshot.queryParamMap.get('returnUrl');
    return isInternalPath(raw) && !raw.startsWith('/acceso') ? raw : null;
  }
}
