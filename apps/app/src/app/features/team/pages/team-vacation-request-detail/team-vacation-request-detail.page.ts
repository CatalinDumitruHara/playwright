// ARC-036 · Detalle de solicitud del equipo (manager) · EP-018, EP-019
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { VacationRequestDetail } from '@api-types';
import { TeamApiService } from '../../../../core/api/team-api.service';

@Component({
  selector: 'app-team-vacation-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './team-vacation-request-detail.page.html',
  styleUrl: './team-vacation-request-detail.page.scss',
})
export class TeamVacationRequestDetailPage implements OnInit {
  private teamApi = inject(TeamApiService);
  private route = inject(ActivatedRoute);

  readonly requestId = signal<string>('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly request = signal<VacationRequestDetail | null>(null);
  readonly approving = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly isPending = computed(() => this.request()?.status === 'Pendiente');

  ngOnInit(): void {
    this.requestId.set(this.route.snapshot.paramMap.get('id') ?? '');
    this.load();
  }

  load(): void {
    const id = this.requestId();
    if (!id) {
      this.error.set('Solicitud no encontrada');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.teamApi.getTeamRequest(id).subscribe({
      next: (detail) => {
        this.request.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          'No ha sido posible cargar la solicitud, inténtalo de nuevo'
        );
        this.loading.set(false);
      },
    });
  }

  approve(): void {
    const id = this.requestId();
    if (!id || !this.isPending() || this.approving()) {
      return;
    }
    this.approving.set(true);
    this.actionError.set(null);
    this.teamApi.approve(id).subscribe({
      next: (detail) => {
        this.request.set(detail);
        this.approving.set(false);
      },
      error: () => {
        this.actionError.set(
          'No ha sido posible aprobar la solicitud, inténtalo de nuevo'
        );
        this.approving.set(false);
      },
    });
  }
}
