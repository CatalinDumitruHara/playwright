
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { B2bButtonComponent, B2bNotificationInlineComponent, B2bReadDataComponent } from '@mapfre-tech/b2b-components';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-incident-create-confirmation',
  templateUrl: './incident-create-confirmation.page.html',
  styleUrls: [],
  standalone: true,
  imports: [
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bButtonComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentCreateConfirmationPage {
  private router = inject(Router);
  // TODO: Get incidentId from ActivatedRoute state or params
  private incidentId = 'INC-2024-000001';

  navigateToIncidentDetail(): void {
    this.router.navigate(['/mis-incidencias', this.incidentId]);
  }

  navigateToCreateIncident(): void {
    this.router.navigate(['/incidencias/nueva']);
  }
}
