import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { isInternalPath } from '../../core/auth/session.model';

@Component({
  selector: 'app-unauthorized-access-page',
  standalone: true,
  imports: [
    B2bButtonComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
  ],
  templateUrl: './unauthorized-access.page.html',
  styleUrls: ['./unauthorized-access.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnauthorizedAccessPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthenticationService);

  readonly user = this.auth.currentUser;
  readonly requestedPath: string = this.resolveRequestedPath();

  back(): void {
    void this.router.navigate(['/inicio']);
  }

  private resolveRequestedPath(): string {
    const raw = this.route.snapshot.queryParamMap.get('ruta');
    return isInternalPath(raw) ? raw : '—';
  }
}
