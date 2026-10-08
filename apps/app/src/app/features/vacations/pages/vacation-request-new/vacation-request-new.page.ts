// ARC-029 · Alta de solicitud de vacaciones (empleado) — /solicitudes/nueva
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { VacationRequestCreate, VacationRequestDetail } from '@api-types';
import { VacationRequestsApiService } from '../../../../core/api/vacation-requests-api.service';

export const dateRangeValidator: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const start = group.get('start_date')?.value as string | null;
  const end = group.get('end_date')?.value as string | null;
  // Fechas ISO 'YYYY-MM-DD': la comparación lexicográfica es cronológica.
  return start && end && end < start ? { dateRange: true } : null;
};

@Component({
  selector: 'app-vacation-request-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vacation-request-new.page.html',
  styleUrl: './vacation-request-new.page.scss',
})
export class VacationRequestNewPage {
  private fb = inject(FormBuilder);
  private api = inject(VacationRequestsApiService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<VacationRequestDetail | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      reason: ['', Validators.maxLength(500)],
    },
    { validators: [dateRangeValidator] }
  );

  get showDateRangeError(): boolean {
    const end = this.form.controls.end_date;
    return !!this.form.errors?.['dateRange'] && (end.touched || end.dirty);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { start_date, end_date, reason } = this.form.getRawValue();
    const body: VacationRequestCreate = { start_date, end_date };
    const trimmed = reason.trim();
    if (trimmed) {
      body.reason = trimmed;
    }

    this.loading.set(true);
    this.error.set(null);
    this.api.create(body).subscribe({
      next: (detail) => {
        this.loading.set(false);
        this.data.set(detail);
        this.router.navigate(['/solicitudes/nueva/confirmacion'], {
          state: { request: detail },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.toMessage(err));
      },
    });
  }

  private toMessage(err: HttpErrorResponse): string {
    const message = err?.error?.message;
    if (typeof message === 'string' && message) {
      return message;
    }
    switch (err?.status) {
      case 400:
      case 422:
        return 'Los datos de la solicitud no son válidos. Revisa las fechas.';
      case 409:
        return 'Las fechas se solapan con otra solicitud existente.';
      default:
        return 'No ha sido posible registrar la solicitud, inténtalo de nuevo.';
    }
  }
}
