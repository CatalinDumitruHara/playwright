import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  B2bNotificationInlineComponent,
  B2bPaginatorComponent,
  B2bSearchComponent,
  B2bTableContainerComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentListPage, IncidentSummary } from '@api-types';
import { Observable, of } from 'rxjs';
import { IncidentsService } from '../../services/incidents.service';

interface B2bTableModel<T> {
  headers: { id: keyof T | string; label: string; type?: string }[];
  data: T[];
}

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
  ],
})
export class MyIncidentsPage implements OnInit {
  private readonly incidentsService = inject(IncidentsService);
  private readonly router = inject(Router);

  incidentsData$: Observable<IncidentListPage> = of({
    items: [],
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 1,
  });

  tableModel: B2bTableModel<IncidentSummary> = {
    headers: [
      { id: 'reference_code', label: 'Código' },
      { id: 'room_name', label: 'Sala' },
      { id: 'office_name', label: 'Oficina' },
      { id: 'category_name', label: 'Categoría' },
      { id: 'created_at', label: 'Fecha de alta', type: 'date' },
      { id: 'status_code', label: 'Estado', type: 'tag' },
      { id: 'assigned_technician_name', label: 'Técnico asignado' },
      { id: 'updated_at', label: 'Última actualización', type: 'date' },
    ],
    data: [],
  };

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents(): void {
    this.incidentsData$ = this.incidentsService.getMyIncidents();
  }

  onSearch(event: Event): void {
    const query = (event as CustomEvent).detail;
    // TODO: Implement search logic
    console.log('Search query:', query);
  }

  onPageChange(page: number): void {
    // TODO: Implement pagination logic
    console.log('Page changed:', page);
  }

  goToNewIncident(): void {
    this.router.navigate(['/incidencias/nueva']);
  }

  goToIncidentDetail(incident: IncidentSummary): void {
    this.router.navigate(['/mis-incidencias', incident.id]);
  }
}
