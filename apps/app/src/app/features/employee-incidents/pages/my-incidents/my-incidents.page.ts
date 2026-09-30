import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  B2bNotificationInlineComponent,
  B2bPaginatorComponent,
  B2bSearchComponent,
  B2bTableContainerComponent,
  B2bTagComponent,
  B2bButtonComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentListPage, IncidentSummary } from '@api-types';
import { Observable, of } from 'rxjs';
import { IncidentsService } from '../../services/incidents.service';

@Component({
  selector: 'app-my-incidents-page',
  templateUrl: './my-incidents.page.html',
  styleUrls: [],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bTableContainerComponent,
    B2bPaginatorComponent,
    B2bSearchComponent,
    B2bNotificationInlineComponent,
    B2bTagComponent,
    B2bButtonComponent,
  ],
})
export class MyIncidentsPage implements OnInit {
  private readonly incidentsService = inject(IncidentsService);
  private readonly router = inject(Router);

  incidentsData$: Observable<IncidentListPage> = of({
    items: [],
    total: 0,
  });

  tableModel = {
    headers: [
      { id: 'reference_code', label: 'Código' },
      { id: 'room', label: 'Sala' },
      { id: 'category', label: 'Categoría' },
      { id: 'created_at', label: 'Fecha de alta' },
      { id: 'status', label: 'Estado' },
      { id: 'assigned_to', label: 'Técnico asignado' },
    ],
  };

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents(page = 1, query?: string): void {
    this.incidentsData$ = this.incidentsService.getMyIncidents({
      page,
      search: query,
    });
  }

  onSearch(event: Event): void {
    const query = (event as CustomEvent).detail;
    this.loadIncidents(1, query);
  }

  onPageChange(pageIndex: number): void {
    this.loadIncidents(pageIndex + 1); // Paginator is 0-based, API is 1-based
  }

  goToNewIncident(): void {
    this.router.navigate(['/incidencias/nueva']);
  }

  goToIncidentDetail(incident: IncidentSummary): void {
    this.router.navigate(['/mis-incidencias', incident.id]);
  }
}
