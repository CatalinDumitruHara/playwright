// ARC-032 · Detalle de una solicitud de vacaciones propia — /solicitudes/:id
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { VacationRequestDetail } from '@api-types';
import { VacationRequestsApiService } from '../../../../core/api/vacation-requests-api.service';

@Component({
  selector: 'app-vacation-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vacation-request-detail.page.html',
  styleUrl: './vacation-request-detail.page.scss',
})
export class VacationRequestDetailPage implements OnInit {
  private api = inject(VacationRequestsApiService);
  private route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<VacationRequestDetail | null>(null);
  readonly downloading = signal(false);
  readonly downloadError = signal<string | null>(null);

  readonly canCancel = computed(() => this.data()?.status === 'Pendiente');
  readonly canDownloadProof = computed(() => this.data()?.status === 'Aprobada');

  private requestId = '';

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
            : err?.status === 403
              ? 'No tienes acceso a esta solicitud.'
              : 'No ha sido posible cargar la solicitud, inténtalo de nuevo.'
        );
      },
    });
  }

  downloadProof(): void {
    const id = this.data()?.request_id ?? this.requestId;
    this.downloading.set(true);
    this.downloadError.set(null);
    this.api.downloadProof(id).subscribe({
      next: (blob) => {
        this.downloading.set(false);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `solicitud-${id}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading.set(false);
        this.downloadError.set('No ha sido posible descargar el comprobante, inténtalo de nuevo.');
      },
    });
  }
}
