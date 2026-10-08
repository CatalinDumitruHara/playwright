// Pantalla admin · Detalle y edición de usuario (/admin/usuarios/:id) — EP-003, EP-004, EP-005
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserDetail, UserRole, UserStatus } from '@api-types';
import { AdminUsersApiService } from '../../../../core/api/admin-users-api.service';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-user-detail.page.html',
  styleUrl: './admin-user-detail.page.scss',
})
export class AdminUserDetailPage implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AdminUsersApiService);
  private route = inject(ActivatedRoute);

  readonly roles: UserRole[] = ['EMPLEADO', 'MANAGER'];
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly user = signal<UserDetail | null>(null);

  readonly form = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    user_role: ['EMPLEADO' as UserRole, Validators.required],
  });

  private userId = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  load(): void {
    if (!this.userId) {
      this.error.set('Usuario no encontrado');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.getById(this.userId).subscribe({
      next: (user) => {
        this.applyUser(user);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No ha sido posible cargar el usuario');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api
      .update(this.userId, {
        full_name: value.full_name.trim(),
        user_role: value.user_role,
      })
      .subscribe({
        next: (user) => {
          this.applyUser(user);
          this.saving.set(false);
          this.success.set('Usuario actualizado');
        },
        error: () => {
          this.saving.set(false);
          this.error.set('No ha sido posible actualizar el usuario');
        },
      });
  }

  toggleStatus(): void {
    const current = this.user();
    if (!current) {
      return;
    }
    const nextStatus: UserStatus =
      current.status === 'Activo' ? 'Inactivo' : 'Activo';
    const action = nextStatus === 'Activo' ? 'activar' : 'desactivar';
    if (!confirm(`¿Seguro que quieres ${action} a ${current.full_name}?`)) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api.updateStatus(this.userId, { status: nextStatus }).subscribe({
      next: (user) => {
        this.applyUser(user);
        this.saving.set(false);
        this.success.set(
          nextStatus === 'Activo' ? 'Usuario activado' : 'Usuario desactivado'
        );
      },
      error: () => {
        this.saving.set(false);
        this.error.set('No ha sido posible cambiar el estado del usuario');
      },
    });
  }

  private applyUser(user: UserDetail): void {
    this.user.set(user);
    this.form.reset({ full_name: user.full_name, user_role: user.user_role });
  }
}
