// ARC-035 · Solicitudes del equipo (manager) · EP-017
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VacationRequestSummary } from '@api-types';
import { TeamApiService } from '../../../../core/api/team-api.service';

@Component({
  selector: 'app-team-vacation-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './team-vacation-requests.page.html',
  styleUrl: './team-vacation-requests.page.scss',
})
export class TeamVacationRequestsPage implements OnInit {
  private teamApi = inject(TeamApiService);

  readonly pageSize = 20;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<VacationRequestSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize))
  );
  readonly hasPrevious = computed(() => this.page() > 1);
  readonly hasNext = computed(() => this.page() < this.totalPages());

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.teamApi.getTeamRequests(page, this.pageSize).subscribe({
      next: (list) => {
        this.items.set(list.items ?? []);
        this.total.set(list.total ?? 0);
        this.page.set(list.page ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          'No ha sido posible cargar las solicitudes del equipo, inténtalo de nuevo'
        );
        this.loading.set(false);
      },
    });
  }

  previous(): void {
    if (this.hasPrevious()) {
      this.load(this.page() - 1);
    }
  }

  next(): void {
    if (this.hasNext()) {
      this.load(this.page() + 1);
    }
  }
}
