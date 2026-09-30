import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { B2bSpinnerComponent, B2bTableContainerComponent, B2bNotificationInlineComponent } from '@mapfre-tech/b2b-components';
import { Incident } from '../../models/incident.model';
import { IncidentService } from '../../services/incident.service';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-my-incidents',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bSpinnerComponent,
    B2bTableContainerComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './my-incidents.page.html',
})
export class MyIncidentsPage implements OnInit {
  incidents$!: Observable<Incident[]>;
  loading = true;
  error = false;

  constructor(private readonly incidentService: IncidentService) {}

  ngOnInit(): void {
    this.incidents$ = this.incidentService.getMyIncidents().pipe(
      catchError(() => {
        this.error = true;
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }
}
