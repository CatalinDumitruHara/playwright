import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { B2bButtonComponent, B2bNotificationInlineComponent, B2bReadDataComponent } from '@mapfre-tech/b2b-components';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

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
export class IncidentCreateConfirmationPage implements OnInit {
  private router = inject(Router);
  private location = inject(Location);

  incidentId = signal<string | undefined>(undefined);

  constructor() {
    const navigationState = this.location.getState() as { incidentId?: string };
    this.incidentId.set(navigationState?.incidentId);
  }

  ngOnInit(): void {
    if (!this.incidentId()) {
      this.router.navigate(['/incidents/not-found']);
    }
  }

  navigateToIncidentDetail(): void {
    this.router.navigate(['/mis-incidencias', this.incidentId()]);
  }

  navigateToCreateIncident(): void {
    this.router.navigate(['/incidencias/nueva']);
  }
}
