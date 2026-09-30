import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IncidentHistoryPage as IncidentHistory } from '@api-types';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IncidentsService } from '../../services/incidents.service';
import {
  B2bButtonComponent,
  B2bTableContainerComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-incident-history-page',
  templateUrl: './incident-history.page.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule, B2bTableContainerComponent, B2bButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentHistoryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly incidentsService = inject(IncidentsService);
  private readonly location = inject(Location);

  history$!: Observable<IncidentHistory>;

  ngOnInit(): void {
    this.history$ = this.route.paramMap.pipe(
      switchMap(params => {
        const incidentId = params.get('id');
        if (!incidentId) {
          return of({ items: [] });
        }
        return this.incidentsService.getIncidentHistory(incidentId);
      })
    );
  }

  goBack(): void {
    this.location.back();
  }
}
