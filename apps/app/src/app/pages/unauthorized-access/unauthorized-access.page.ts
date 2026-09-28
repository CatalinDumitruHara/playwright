
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'b2b-unauthorized-access',
  standalone: true,
  imports: [
    CommonModule,
    B2bButtonComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './unauthorized-access.page.html',
  styleUrls: ['./unauthorized-access.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnauthorizedAccessPage {
  protected readonly userRole: string;
  protected readonly requestedUrl: string;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthenticationService);

  constructor() {
    this.userRole = this.authService.sessionContext()?.permissions[0] || 'N/A';
    this.requestedUrl = this.router.url;
  }

  onBack(): void {
    this.router.navigate(['/']);
  }
}
