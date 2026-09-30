import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MtSpinnerModule, MtTableModule, MtAlertModule } from '@mapfre-tech/b2b-components';
import { Incident } from '../../models/incident.model';
import { IncidentService } from '../../services/incident.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-my-incidents',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MtSpinnerModule,
    MtTableModule,
    MtAlertModule,
  ],
  templateUrl: './my-incidents.page.html',
})
export class MyIncidentsPage implements OnInit {
  constructor(private readonly incidentService: IncidentService) {}

  incidents$: Observable<Incident[]>;
  loading = true;
  error = false;

  ngOnInit(): void {
    this.incidents$ = this.incidentService.getMyIncidents().pipe(
      catchError(() => {
        this.error = true;
        return of([]);
      })
    );

    this.incidents$.subscribe(() => {
      this.loading = false;
    });
  }
}
