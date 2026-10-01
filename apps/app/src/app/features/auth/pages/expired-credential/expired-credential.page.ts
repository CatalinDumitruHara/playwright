import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
} from '@mapfre-tech/b2b-components';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-expired-credential',
  standalone: true,
  imports: [
    CommonModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    RouterModule,
  ],
  templateUrl: './expired-credential.page.html',
  styleUrl: './expired-credential.page.scss',
})
export class ExpiredCredentialPage {
  public expirationDate: string | null = null;

  constructor(private router: Router) {
    const navigationState = this.router.getCurrentNavigation()?.extras?.state;
    if (navigationState && 'expirationDate' in navigationState) {
      this.expirationDate = navigationState['expirationDate'] ?? null;
    } else if (typeof history !== 'undefined' && history.state?.expirationDate) {
      this.expirationDate = history.state.expirationDate;
    }
  }

  public goBackToLogin(): void {
    this.router.navigate(['/acceso']);
  }
}
