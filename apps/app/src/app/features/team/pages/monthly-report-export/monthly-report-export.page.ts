// Pantalla manager · Exportación de informe mensual · EP-021, EP-022
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';
import { ExportJobStatus, MonthlyReportRequest } from '@api-types';
import { ReportsApiService } from '../../../../core/api/reports-api.service';

export const EXPORT_POLL_INTERVAL_MS = 3000;

const isInProgress = (job: ExportJobStatus): boolean =>
  job.status === 'PENDING' || job.status === 'PROCESSING';

@Component({
  selector: 'app-monthly-report-export',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './monthly-report-export.page.html',
  styleUrl: './monthly-report-export.page.scss',
})
export class MonthlyReportExportPage {
  private fb = inject(FormBuilder);
  private reportsApi = inject(ReportsApiService);
  private destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly job = signal<ExportJobStatus | null>(null);

  readonly months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  private pollSub: Subscription | null = null;

  readonly exportForm = (() => {
    const now = new Date();
    return this.fb.nonNullable.group({
      report_month: [
        now.getMonth() + 1,
        [Validators.required, Validators.min(1), Validators.max(12)],
      ],
      report_year: [
        now.getFullYear(),
        [Validators.required, Validators.pattern(/^\d{4}$/)],
      ],
    });
  })();

  constructor() {
    this.destroyRef.onDestroy(() => this.stopPolling());
  }

  get inProgress(): boolean {
    const current = this.job();
    return !!current && isInProgress(current);
  }

  onSubmit(): void {
    if (this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }
    if (this.submitting() || this.inProgress) {
      return;
    }

    const { report_month, report_year } = this.exportForm.getRawValue();
    const body: MonthlyReportRequest = {
      report_month: Number(report_month),
      report_year: Number(report_year),
    };

    this.stopPolling();
    this.submitting.set(true);
    this.error.set(null);
    this.job.set(null);

    this.reportsApi
      .createMonthlyExport(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          this.submitting.set(false);
          this.handleJob(job);
          if (isInProgress(job)) {
            this.startPolling(job.job_id);
          }
        },
        error: () => {
          this.submitting.set(false);
          this.error.set(
            'No ha sido posible solicitar la exportación, inténtalo de nuevo'
          );
        },
      });
  }

  private startPolling(jobId: string): void {
    this.stopPolling();
    this.pollSub = timer(EXPORT_POLL_INTERVAL_MS, EXPORT_POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.reportsApi.getExportJob(jobId)),
        takeWhile((job) => isInProgress(job), true),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (job) => this.handleJob(job),
        error: () => {
          this.error.set(
            'No ha sido posible consultar el estado de la exportación'
          );
          this.job.set(null);
        },
      });
  }

  private handleJob(job: ExportJobStatus): void {
    this.job.set(job);
    if (job.status === 'FAILED') {
      this.error.set('La generación del informe ha fallado');
    }
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }
}
