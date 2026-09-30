import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IncidentsService } from '../../services/incidents.service';
import { Location, CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-incident-photo-page',
  templateUrl: './incident-photo.page.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule, B2bNotificationInlineComponent, B2bButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentPhotoPage implements OnInit {
  photo$: Observable<any> = of(undefined);

  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly route: ActivatedRoute,
    private readonly location: Location
  ) {}

  ngOnInit(): void {
    const incidentId = this.route.snapshot.paramMap.get('id');
    if (incidentId) {
      this.photo$ = this.incidentsService.getIncidentPhoto(incidentId);
    }
  }

  back(): void {
    this.location.back();
  }
}
