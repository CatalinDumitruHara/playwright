import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-permissions-changed',
  templateUrl: './permissions-changed.page.html',
  styleUrls: ['./permissions-changed.page.scss'],
  standalone: true,
  imports: [
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bButtonComponent,
  ],
})
export class PermissionsChangedPage {
  currentRole = 'Usuario'; // Placeholder

  constructor(private router: Router) {}

  reloadMenu(): void {
    // TODO: Implement actual menu reload logic.
    // For now, it navigates to the home page.
    this.router.navigate(['/']);
  }
}
