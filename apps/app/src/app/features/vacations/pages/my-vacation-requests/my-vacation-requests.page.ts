// ARC-031 · Listado paginado de mis solicitudes de vacaciones — /solicitudes
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VacationRequestList } from '@api-types';
import { VacationRequestsApiService } from '../../../../core/api/vacation-requests-api.service';

@Component({
  selector: 'app-my-vacation-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-vacation-requests.page.html',
  styleUrl: './my-vacation-requests.page.scss',
})
export class MyVacationRequestsPage implements OnInit {
  private api = inject(VacationRequestsApiService);

  readonly pageSize = 20;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<VacationRequestList | null>(null);
  readonly page = signal(1);

  readonly totalPages = computed(() => {
    const d = this.data();
    if (!d || !d.size) {
      return 1;
    }
    return Math.max(1, Math.ceil(d.total / d.size));
  });
  readonly hasPrevious = computed(() => this.page() > 1);
  readonly hasNext = computed(() => this.page() < this.totalPages());
  readonly isEmpty = computed(() => {
    const d = this.data();
    return !!d && d.items.length === 0;
  });

  ngOnInit(): void {
    this.load(1);
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

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getMyRequests(page, this.pageSize).subscribe({
      next: (list) => {
        this.data.set(list);
        this.page.set(list.page ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No ha sido posible cargar tus solicitudes, inténtalo de nuevo.');
      },
    });
  }
}
