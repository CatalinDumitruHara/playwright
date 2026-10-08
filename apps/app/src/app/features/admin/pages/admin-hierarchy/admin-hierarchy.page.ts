// Pantalla admin · Jerarquía empleado-manager (/admin/jerarquia) — EP-006, EP-007, EP-008, EP-009
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HierarchyItem, UserSummary } from '@api-types';
import { AdminHierarchyApiService } from '../../../../core/api/admin-hierarchy-api.service';
import { AdminUsersApiService } from '../../../../core/api/admin-users-api.service';

type ManagerControl = FormControl<string>;

@Component({
  selector: 'app-admin-hierarchy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-hierarchy.page.html',
  styleUrl: './admin-hierarchy.page.scss',
})
export class AdminHierarchyPage implements OnInit {
  private hierarchyApi = inject(AdminHierarchyApiService);
  private usersApi = inject(AdminUsersApiService);

  readonly pageSize = 20;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly items = signal<HierarchyItem[]>([]);
  readonly managers = signal<UserSummary[]>([]);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize))
  );

  private controls: Record<string, ManagerControl> = {};

  ngOnInit(): void {
    this.loadManagers();
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.hierarchyApi.list(page, this.pageSize).subscribe({
      next: (res) => {
        const items = res.items ?? [];
        this.controls = {};
        for (const item of items) {
          this.controls[item.employee_id] = this.buildControl(item);
        }
        this.items.set(items);
        this.total.set(res.total ?? 0);
        this.page.set(res.page ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No ha sido posible cargar la jerarquía');
        this.loading.set(false);
      },
    });
  }

  loadManagers(): void {
    this.usersApi.list(1, 100).subscribe({
      next: (res) =>
        this.managers.set(
          (res.items ?? []).filter(
            (u) => u.user_role === 'MANAGER' && u.status === 'Activo'
          )
        ),
      error: () =>
        this.error.set('No ha sido posible cargar los managers disponibles'),
    });
  }

  controlFor(item: HierarchyItem): ManagerControl {
    let control = this.controls[item.employee_id];
    if (!control) {
      control = this.buildControl(item);
      this.controls[item.employee_id] = control;
    }
    return control;
  }

  save(item: HierarchyItem): void {
    const control = this.controlFor(item);
    const managerId = control.value;
    if (control.invalid || !managerId || managerId === item.manager_id) {
      control.markAsTouched();
      return;
    }
    const body = { manager_id: managerId };
    const request$ = item.manager_id
      ? this.hierarchyApi.changeManager(item.employee_id, body)
      : this.hierarchyApi.assignManager(item.employee_id, body);

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(
          item.manager_id ? 'Manager cambiado' : 'Manager asignado'
        );
        this.load(this.page());
      },
      error: () => {
        this.saving.set(false);
        this.error.set('No ha sido posible guardar el manager');
      },
    });
  }

  remove(item: HierarchyItem): void {
    if (!item.manager_id) {
      return;
    }
    if (
      !confirm(`¿Seguro que quieres quitar el manager de ${item.employee_name}?`)
    ) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    this.hierarchyApi.removeManager(item.employee_id).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Manager eliminado');
        this.load(this.page());
      },
      error: () => {
        this.saving.set(false);
        this.error.set('No ha sido posible quitar el manager');
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

  private buildControl(item: HierarchyItem): ManagerControl {
    return new FormControl<string>(item.manager_id ?? '', {
      nonNullable: true,
      validators: Validators.required,
    });
  }
}
