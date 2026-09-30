import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IncidentService } from '../../services/incident.service';
import { Incident } from '../../models/incident.model';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { B2bSpinnerComponent, B2bNotificationInlineComponent } from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, B2bSpinnerComponent, B2bNotificationInlineComponent],
  templateUrl: './incident-detail.page.html',
})
export class IncidentDetailPage implements OnInit {
  incident$!: Observable<Incident | null>;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private incidentService: IncidentService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.incident$ = this.incidentService.getIncidentById(id).pipe(
        catchError(() => {
          this.router.navigate(['/incidencias/no-encontrada']);
          return of(null);
        })
      );
    } else {
      this.router.navigate(['/incidencias/no-encontrada']);
    }
  }
}
