import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IncidentDetail } from '@api-types';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IncidentsService } from '../../services/incidents.service';
import {
  B2bButtonComponent,
  B2bLinkComponent,
  B2bReadDataComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-incident-detail-page',
  templateUrl: './incident-detail.page.html',
  styleUrls: [],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bReadDataComponent,
    B2bLinkComponent,
    B2bButtonComponent,
    B2bTagComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly incidentsService = inject(IncidentsService);

  incident$: Observable<IncidentDetail | null> = of(null);

  ngOnInit(): void {
    const incidentId = this.route.snapshot.paramMap.get('incidentId');
    if (incidentId) {
      this.incident$ = this.incidentsService.getIncidentDetail(incidentId).pipe(
        catchError(() => {
          this.router.navigate(['/incidencias/no-encontrada']);
          return of(null);
        })
      );
    } else {
      this.router.navigate(['/incidencias/no-encontrada']);
      this.incident$ = of(null);
    }
  }
}

