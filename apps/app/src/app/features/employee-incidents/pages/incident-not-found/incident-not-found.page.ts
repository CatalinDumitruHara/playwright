import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-incident-not-found',
  templateUrl: './incident-not-found.page.html',
  styleUrls: ['./incident-not-found.page.scss'],
})
export class IncidentNotFoundPage {
  constructor(private router: Router) {}

  navigateToMyIncidents(): void {
    this.router.navigate(['/mis-incidencias']);
  }
}
