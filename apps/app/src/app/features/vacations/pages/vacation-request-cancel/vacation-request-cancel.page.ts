// ARC-033 · Cancelación de una solicitud de vacaciones pendiente — /solicitudes/:id/cancelar
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VacationRequestDetail } from '@api-types';
import { VacationRequestsApiService } from '../../../../core/api/vacation-requests-api.service';

@Component({
  selector: 'app-vacation-request-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vacation-request-cancel.page.html',
  styleUrl: './vacation-request-cancel.page.scss',
})
export class VacationRequestCancelPage implements OnInit {
  private api = inject(VacationRequestsApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<VacationRequestDetail | null>(null);
  readonly submitting = signal(false);

  readonly canCancel = computed(() => this.data()?.status === 'Pendiente');

  requestId = '';

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.requestId) {
      this.error.set('Solicitud no encontrada.');
      return;
    }
    this.loading.set(true);
    this.api.getById(this.requestId).subscribe({
      next: (detail) => {
        this.data.set(detail);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err?.status === 404
            ? 'Solicitud no encontrada.'
            : 'No ha sido posible cargar la solicitud, inténtalo de nuevo.'
        );
      },
    });
  }

  confirm(): void {
    if (!this.canCancel() || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.api.cancel(this.requestId).subscribe({
      next: (detail) => {
        this.submitting.set(false);
        this.data.set(detail);
        this.router.navigate(['/solicitudes', this.requestId]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const message = err?.error?.message;
        this.error.set(
          typeof message === 'string' && message
            ? message
            : err?.status === 409 || err?.status === 422
              ? 'La solicitud ya no está pendiente y no se puede cancelar.'
              : 'No ha sido posible cancelar la solicitud, inténtalo de nuevo.'
        );
      },
    });
  }

  back(): void {
    this.router.navigate(['/solicitudes', this.requestId]);
  }
}
