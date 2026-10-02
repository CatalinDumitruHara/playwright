import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentTrayService } from '../../incident-tray.service';
import {
  TrayIncidentDetail,
  UNASSIGNED_LABEL,
  trayErrorMessage,
} from '../../incident-tray.models';
import { statusLabel } from '../../../my-incidents/my-incidents.models';

export const MSG_START_LOAD_ERROR =
  'No se ha podido recuperar la incidencia en este momento. Inténtalo de nuevo';
export const MSG_START_SUBMIT_ERROR =
  'No se ha podido iniciar la atención de la incidencia. Inténtalo de nuevo';

/** ARC-033 · Confirmación de inicio de atención (transición a EN_CURSO). */
@Component({
  selector: 'app-start-attention-page',
  standalone: true,
  imports: [
    CommonModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
  ],
  templateUrl: './start-attention.page.html',
  styleUrl: './start-attention.page.scss',
})
export class StartAttentionPage implements OnInit {
  private service = inject(IncidentTrayService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly targetStatusLabel = 'En curso';

  readonly incidentId = signal<string>('');
  readonly incident = signal<TrayIncidentDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly currentStatus = computed(() => {
    const inc = this.incident();
    return inc ? statusLabel(inc.status) || inc.statusLabel : '';
  });
  readonly assignee = computed(
    () => this.incident()?.assignedTechnicianName ?? UNASSIGNED_LABEL
  );
  readonly confirmDisabled = computed(
    () => this.submitting() || this.loading() || !this.incident()
  );

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pm) => {
      this.incidentId.set(pm.get('id') ?? '');
      this.load();
    });
  }

  load(): void {
    const id = this.incidentId();
    this.loading.set(true);
    this.loadError.set(null);
    this.service
      .detail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (inc) => {
          this.incident.set(inc);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.incident.set(null);
          this.loadError.set(trayErrorMessage(err, MSG_START_LOAD_ERROR));
          this.loading.set(false);
        },
      });
  }

  confirm(): void {
    if (this.confirmDisabled()) return;
    const id = this.incidentId();
    this.submitting.set(true);
    this.submitError.set(null);
    this.service
      .transition(id, 'EN_CURSO')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/incidencias', id], {
            queryParams: { resultado: 'iniciada' },
          });
        },
        error: (err: unknown) => {
          this.submitError.set(trayErrorMessage(err, MSG_START_SUBMIT_ERROR));
          this.submitting.set(false);
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/incidencias', this.incidentId()]);
  }
}
