
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-incident-create-confirmation',
  templateUrl: './incident-create-confirmation.page.html',
  styleUrls: [],
  standalone: true,
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
