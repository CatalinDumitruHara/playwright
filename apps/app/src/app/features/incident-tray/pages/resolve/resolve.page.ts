import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { TrayIncidentDetail, trayErrorMessage } from '../../incident-tray.models';
import { statusLabel } from '../../../my-incidents/my-incidents.models';

export const RESOLVE_NOTE_MAX = 500;
export const MSG_RESOLVE_NOTE_LENGTH = 'El comentario supera los 500 caracteres';
export const MSG_RESOLVE_LOAD_ERROR =
  'No se ha podido recuperar la incidencia en este momento. Inténtalo de nuevo';
export const MSG_RESOLVE_SUBMIT_ERROR =
  'No se ha podido marcar la incidencia como resuelta. Inténtalo de nuevo';

/** ARC-034 · Marcar la incidencia como resuelta (transición a RESUELTA). */
@Component({
  selector: 'app-resolve-incident-page',
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
  templateUrl: './resolve.page.html',
  styleUrl: './resolve.page.scss',
})
export class ResolveIncidentPage implements OnInit {
  private service = inject(IncidentTrayService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly targetStatusLabel = 'Resuelta';
  readonly noteMax = RESOLVE_NOTE_MAX;

  readonly note = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(RESOLVE_NOTE_MAX)],
  });
  private readonly noteValue = toSignal(this.note.valueChanges, { initialValue: '' });

  readonly incidentId = signal<string>('');
  readonly incident = signal<TrayIncidentDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly noteLength = computed(() => this.noteValue().length);
  readonly formError = computed(() =>
    this.noteLength() > RESOLVE_NOTE_MAX ? MSG_RESOLVE_NOTE_LENGTH : null
  );
  readonly currentStatus = computed(() => {
    const inc = this.incident();
    return inc ? statusLabel(inc.status) || inc.statusLabel : '';
  });
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
          this.loadError.set(trayErrorMessage(err, MSG_RESOLVE_LOAD_ERROR));
          this.loading.set(false);
        },
      });
  }

  confirm(): void {
    if (this.confirmDisabled()) return;
    this.note.markAsTouched();
    if (this.note.invalid || this.formError()) return;
    const id = this.incidentId();
    const note = this.note.value.trim();
    this.submitting.set(true);
    this.submitError.set(null);
    this.service
      .transition(id, 'RESUELTA', note || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/incidencias', id], {
            queryParams: { resultado: 'resuelta' },
          });
        },
        error: (err: unknown) => {
          this.submitError.set(trayErrorMessage(err, MSG_RESOLVE_SUBMIT_ERROR));
          this.submitting.set(false);
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/incidencias', this.incidentId()]);
  }
}
