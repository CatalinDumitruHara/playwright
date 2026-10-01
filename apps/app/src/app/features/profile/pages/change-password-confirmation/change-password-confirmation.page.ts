import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-change-password-confirmation',
  templateUrl: './change-password-confirmation.page.html',
  styleUrls: ['./change-password-confirmation.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
  ],
})
export class ChangePasswordConfirmationPage {
  private router = inject(Router);

  changeDateTime: Date = this.resolveChangeDateTime();

  backToProfile(): void {
    this.router.navigate(['/mi-perfil']);
  }

  private resolveChangeDateTime(): Date {
    const navState = this.router.getCurrentNavigation()?.extras?.state as
      | { changedAt?: string }
      | undefined;
    const historyState =
      typeof history !== 'undefined'
        ? (history.state as { changedAt?: string } | null)
        : null;
    const changedAt = navState?.changedAt ?? historyState?.changedAt;
    if (changedAt) {
      const parsed = new Date(changedAt);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  }
}
