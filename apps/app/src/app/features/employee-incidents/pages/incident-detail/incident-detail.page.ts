import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IncidentService } from '../../services/incident.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  B2bReadDataComponent,
  B2bSpinnerComponent,
  B2bCardPrimaryComponent,
} from '@mapfre-tech/b2b-components';

interface IncidentState {
  incident: any;
  history: any[];
  photo: any;
  loading: boolean;
  error: boolean;
}

@Component({
  selector: 'app-incident-detail',
  templateUrl: './incident-detail.page.html',
  standalone: true,
  imports: [
    CommonModule,
    B2bReadDataComponent,
    B2bSpinnerComponent,
    B2bCardPrimaryComponent,
  ],
})
export class IncidentDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private incidentService = inject(IncidentService);

  private state = signal<IncidentState>({
    incident: null,
    history: [],
    photo: null,
    loading: true,
    error: false,
  });

  incident = computed(() => this.state().incident);
  history = computed(() => this.state().history);
  photo = computed(() => this.state().photo);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);

  private incidentId$ = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('incidentId')))
  );

  constructor() {
    effect(() => {
      const incidentId = this.incidentId$();
      if (incidentId) {
        this.loadIncidentData(incidentId);
      }
    });
  }

  private loadIncidentData(id: string): void {
    this.state.set({ ...this.state(), loading: true, error: false });

    forkJoin({
      incident: this.incidentService.getIncidentDetail(id),
      history: this.incidentService.getIncidentHistory(id),
      photo: this.incidentService.getIncidentPhoto(id),
    })
      .pipe(
        catchError(() => {
          this.router.navigate(['/incidencias/no-encontrada']);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.state.set({
            incident: data.incident,
            history: data.history,
            photo: data.photo,
            loading: false,
            error: false,
          });
        }
      });
  }
}
