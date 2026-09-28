import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { B2bButtonComponent, B2bNotificationInlineComponent } from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-unauthorized-access',
  templateUrl: './unauthorized-access.page.html',
  styleUrls: ['./unauthorized-access.page.scss'],
  standalone: true,
  imports: [B2bNotificationInlineComponent, B2bButtonComponent],
})
export class UnauthorizedAccessComponent {
  constructor(private router: Router) {}

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}
