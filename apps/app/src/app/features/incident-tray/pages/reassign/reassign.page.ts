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
  B2bInputComponent,
  B2bLabelComponent,
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

export const MSG_REASSIGN_TECHNICIAN =
  'Indica un identificador de técnico válido (número entero positivo).';
export const MSG_REASSIGN_HINT =
  'Indica el identificador del técnico de mantenimiento activo destino; el sistema valida que esté activo.';
export const MSG_REASSIGN_LOAD_ERROR =
  'No se ha podido recuperar la incidencia en este momento. Inténtalo de nuevo';
export const MSG_REASSIGN_SUBMIT_ERROR =
  'No se ha podido reasignar la incidencia. Inténtalo de nuevo';

/** Devuelve el entero positivo representado por el valor, o null si no lo es. */
export function toTechnicianId(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export const technicianIdValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null =>
  toTechnicianId(control.value) === null ? { technicianId: true } : null;

/** ARC-030 · Reasignación del técnico de mantenimiento. */
@Component({
  selector: 'app-reassign-incident-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bInputComponent,
    B2bLabelComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
  ],
  templateUrl: './reassign.page.html',
  styleUrl: './reassign.page.scss',
})
export class ReassignIncidentPage implements OnInit {
  private service = inject(IncidentTrayService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly hint = MSG_REASSIGN_HINT;

  readonly technician = new FormControl<number | null>(null, {
    validators: [technicianIdValidator],
  });
  private readonly technicianValue = toSignal(this.technician.valueChanges, {
    initialValue: null,
  });

  readonly incidentId = signal<string>('');
  readonly incident = signal<TrayIncidentDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly touched = signal(false);

  readonly formError = computed(() =>
    this.touched() && toTechnicianId(this.technicianValue()) === null
      ? MSG_REASSIGN_TECHNICIAN
      : null
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
          this.loadError.set(trayErrorMessage(err, MSG_REASSIGN_LOAD_ERROR));
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
    this.technician.markAsTouched();
    const technicianId = toTechnicianId(this.technician.value);
    if (technicianId === null) return;
    const id = this.incidentId();
    this.submitting.set(true);
    this.submitError.set(null);
    this.service
      .reassign(id, Number(technicianId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/incidencias', id], {
            queryParams: { resultado: 'reasignada' },
          });
        },
        error: (err: unknown) => {
          this.submitError.set(trayErrorMessage(err, MSG_REASSIGN_SUBMIT_ERROR));
          this.submitting.set(false);
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/incidencias', this.incidentId()]);
  }
}
