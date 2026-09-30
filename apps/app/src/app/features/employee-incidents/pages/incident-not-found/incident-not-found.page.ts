import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-incident-not-found',
  templateUrl: './incident-not-found.page.html',
  styleUrls: [],
  standalone: true,
  imports: [B2bNotificationInlineComponent, B2bButtonComponent],
})
export class IncidentNotFoundPage {
  constructor(private router: Router) {}

  navigateToMyIncidents(): void {
    this.router.navigate(['/mis-incidencias']);
  }
}
