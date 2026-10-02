import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
  B2bTextAreaComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentTrayService } from '../../incident-tray.service';
import {
  TrayIncidentDetail,
  UNASSIGNED_LABEL,
  trayErrorMessage,
} from '../../incident-tray.models';

export const RELEASE_REASON_MIN = 10;
export const RELEASE_REASON_MAX = 500;
export const MSG_RELEASE_REASON =
  'Indica el motivo de la liberación (mínimo 10 caracteres).';
export const MSG_RELEASE_LOAD_ERROR =
  'No se ha podido recuperar la incidencia en este momento. Inténtalo de nuevo';
export const MSG_RELEASE_SUBMIT_ERROR =
  'No se ha podido liberar la incidencia. Inténtalo de nuevo';

/** Colapsa espacios en blanco consecutivos y recorta los extremos. */
export function normalizeReason(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

/** Motivo obligatorio: entre MIN y MAX caracteres tras normalizar espacios. */
export const releaseReasonValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const n = normalizeReason(typeof control.value === 'string' ? control.value : '');
  if (n.length < RELEASE_REASON_MIN || n.length > RELEASE_REASON_MAX) {
    return { reasonLength: true };
  }
  return null;
};

/** ARC-031 · Liberación de la incidencia con motivo. */
@Component({
  selector: 'app-release-incident-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bLabelComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
    B2bTextAreaComponent,
  ],
  templateUrl: './release.page.html',
  styleUrl: './release.page.scss',
})
export class ReleaseIncidentPage implements OnInit {
  private service = inject(IncidentTrayService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly reasonMax = RELEASE_REASON_MAX;

  readonly reason = new FormControl<string>('', {
    nonNullable: true,
    validators: [releaseReasonValidator],
  });
  private readonly reasonValue = toSignal(this.reason.valueChanges, { initialValue: '' });

  readonly incidentId = signal<string>('');
  readonly incident = signal<TrayIncidentDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly touched = signal(false);

  readonly reasonLength = computed(() => this.reasonValue().length);
  readonly reasonValid = computed(() => {
    const n = normalizeReason(this.reasonValue());
    return n.length >= RELEASE_REASON_MIN && n.length <= RELEASE_REASON_MAX;
  });
  readonly formError = computed(() =>
    this.touched() && !this.reasonValid() ? MSG_RELEASE_REASON : null
  );
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
          this.loadError.set(trayErrorMessage(err, MSG_RELEASE_LOAD_ERROR));
          this.loading.set(false);
        },
      });
  }

  onBlur(): void {
    this.touched.set(true);
  }

  confirm(): void {
    if (this.confirmDisabled()) return;
    this.touched.set(true);
    this.reason.markAsTouched();
    if (this.reason.invalid) return;
    const id = this.incidentId();
    const reason = normalizeReason(this.reason.value);
    this.submitting.set(true);
    this.submitError.set(null);
    this.service
      .release(id, reason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/incidencias', id], {
            queryParams: { resultado: 'liberada' },
          });
        },
        error: (err: unknown) => {
          this.submitError.set(trayErrorMessage(err, MSG_RELEASE_SUBMIT_ERROR));
          this.submitting.set(false);
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/incidencias', this.incidentId()]);
  }
}
