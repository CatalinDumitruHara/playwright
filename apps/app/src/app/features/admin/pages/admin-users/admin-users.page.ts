// Pantalla admin · Listado de usuarios (/admin/usuarios) — EP-001
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserSummary } from '@api-types';
import { AdminUsersApiService } from '../../../../core/api/admin-users-api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss',
})
export class AdminUsersPage implements OnInit {
  private api = inject(AdminUsersApiService);

  readonly pageSize = 20;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly users = signal<UserSummary[]>([]);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize))
  );

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(page, this.pageSize).subscribe({
      next: (res) => {
        this.users.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.page.set(res.page ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No ha sido posible cargar los usuarios');
        this.loading.set(false);
      },
    });
  }

  previous(): void {
    if (this.page() > 1) {
      this.load(this.page() - 1);
    }
  }

  next(): void {
    if (this.page() < this.totalPages()) {
      this.load(this.page() + 1);
    }
  }
}
