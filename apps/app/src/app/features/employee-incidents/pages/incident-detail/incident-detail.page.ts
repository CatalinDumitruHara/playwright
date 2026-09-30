
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IncidentService } from '../../services/incident.service';
import { switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { ReadDataComponent } from '@mapfre-tech/b2b-components/read-data';
import { SpinnerComponent } from '@mapfre-tech/b2b-components/spinner';
import { CardPrimaryDirective } from '@mapfre-tech/b2b-components/card';

@Component({
  selector: 'app-incident-detail',
  templateUrl: './incident-detail.page.html',
  standalone: true,
  imports: [CommonModule, ReadDataComponent, SpinnerComponent, CardPrimaryDirective]
})
export class IncidentDetailPage implements OnInit {
  incidentId: string;
  incident: any;
  history: any[];
  photo: any;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private incidentService: IncidentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.incidentId = params.get('incidentId');
        if (this.incidentId) {
          this.loading = true;
          this.error = false;
          return forkJoin({
            incident: this.incidentService.getIncidentDetail(this.incidentId),
            history: this.incidentService.getIncidentHistory(this.incidentId),
            photo: this.incidentService.getIncidentPhoto(this.incidentId)
          });
        } else {
          this.error = true;
          this.loading = false;
          return of(null);
        }
      })
    ).subscribe({
      next: (data) => {
        if (data) {
          this.incident = data.incident;
          this.history = data.history;
          this.photo = data.photo;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
