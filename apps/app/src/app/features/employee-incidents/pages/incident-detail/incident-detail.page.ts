import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bLinkComponent,
  B2bReadDataComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentDetail } from '../../../../../libs/api-types/src/lib';
import { Observable, catchError, of } from 'rxjs';

import { IncidentsService } from '../../services/incidents.service';

@Component({
  selector: 'app-incident-detail-page',
  templateUrl: './incident-detail.page.html',
  styleUrls: ['./incident-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, B2bReadDataComponent, B2bLinkComponent, B2bButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly incidentsService = inject(IncidentsService);

  incident$: Observable<IncidentDetail | null>;

  ngOnInit(): void {
    const incidentId = this.route.snapshot.paramMap.get('incidentId');
    if (incidentId) {
      this.incident$ = this.incidentsService.getIncidentDetail(incidentId).pipe(
        catchError(() => {
          // Redirect to a 'not-found' page or handle the error as needed
          this.router.navigate(['/not-found']);
          return of(null);
        })
      );
    } else {
      // Handle the case where incidentId is not present in the URL
      this.router.navigate(['/not-found']);
      this.incident$ = of(null);
    }
  }
}

