// Pantalla admin · Alta de usuario (/admin/usuarios/nuevo) — EP-002
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserCreateRequest, UserRole } from '@api-types';
import { AdminUsersApiService } from '../../../../core/api/admin-users-api.service';

@Component({
  selector: 'app-admin-user-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-user-new.page.html',
  styleUrl: './admin-user-new.page.scss',
})
export class AdminUserNewPage {
  private fb = inject(FormBuilder);
  private api = inject(AdminUsersApiService);
  private router = inject(Router);

  readonly roles: UserRole[] = ['EMPLEADO', 'MANAGER'];
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    user_role: ['', Validators.required],
    initial_password: [''],
  });

  isInvalid(name: 'full_name' | 'email' | 'user_role'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const body: UserCreateRequest = {
      full_name: value.full_name.trim(),
      email: value.email.trim(),
      user_role: value.user_role as UserRole,
    };
    if (value.initial_password) {
      body.initial_password = value.initial_password;
    }

    this.loading.set(true);
    this.error.set(null);
    this.api.create(body).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.router.navigate(['/admin/usuarios', user.user_id]);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err?.status === 409
            ? 'El email ya existe'
            : 'No ha sido posible crear el usuario'
        );
      },
    });
  }
}
