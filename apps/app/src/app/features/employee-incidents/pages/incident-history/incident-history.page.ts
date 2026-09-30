import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IncidentHistoryPage as IncidentHistory } from '../../../../../libs/api-types/src/lib';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IncidentsService } from '../../services/incidents.service';

@Component({
  selector: 'app-incident-history-page',
  templateUrl: './incident-history.page.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentHistoryPage implements OnInit {
  history$: Observable<IncidentHistory>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly incidentsService: IncidentsService,
    private readonly location: Location
  ) {}

  ngOnInit(): void {
    this.history$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const incidentId = params.get('id');
        if (!incidentId) {
          // o redirigir, o lanzar error
          return new Observable<IncidentHistory>();
        }
        return this.incidentsService.getIncidentHistory(incidentId);
      })
    );
  }

  goBack(): void {
    this.location.back();
  }
}
