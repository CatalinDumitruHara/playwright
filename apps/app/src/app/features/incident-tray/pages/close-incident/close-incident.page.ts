import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { RESOLUTION_COMMENT_MAX_LENGTH } from '../../incident-tray.models';
import { IncidentView } from '../../../my-incidents/my-incidents.models';

export const MSG_COMMENT_REQUIRED =
  'Debe indicar un comentario de resolución para cerrar la incidencia';
export const MSG_NOT_RESOLVED = 'La incidencia ya no está en estado resuelta';
export const MSG_FORBIDDEN = 'No tiene permisos para realizar esta operación';
export const MSG_CLOSE_FAILED =
  'No se ha podido completar el cierre; inténtelo de nuevo';

function notBlank(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  return typeof v === 'string' && v.trim().length > 0 ? null : { blank: true };
}

/** ARC-037 · Cierre de la incidencia (la ruta actúa como diálogo). */
@Component({
  selector: 'app-close-incident-page',
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
  templateUrl: './close-incident.page.html',
  styleUrl: './close-incident.page.scss',
})
export class CloseIncidentPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private service = inject(IncidentTrayService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly maxLength = RESOLUTION_COMMENT_MAX_LENGTH;

  id = '';
  incident: IncidentView | null = null;
  loading = false;
  loadError = false;
  submitting = false;

  /** Mensaje de validación devuelto por backend (400). */
  serverFieldError: string | null = null;
  /** Error general de la operación de cierre (409/403/otros). */
  submitError: string | null = null;

  readonly form = new FormGroup({
    resolutionComment: new FormControl<string>('', {
      nonNullable: true,
      validators: [notBlank, Validators.maxLength(RESOLUTION_COMMENT_MAX_LENGTH)],
    }),
  });

  get commentControl(): FormControl<string> {
    return this.form.controls.resolutionComment;
  }

  get commentLength(): number {
    return this.commentControl.value?.length ?? 0;
  }

  get isResolved(): boolean {
    return (this.incident?.statusCode ?? '').toUpperCase() === 'RESUELTA';
  }

  get commentError(): string | null {
    if (this.serverFieldError) return this.serverFieldError;
    const c = this.commentControl;
    if ((c.touched || c.dirty) && c.hasError('blank')) {
      return MSG_COMMENT_REQUIRED;
    }
    return null;
  }

  get confirmDisabled(): boolean {
    return this.commentControl.invalid || this.submitting;
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    const preset = this.route.snapshot.queryParamMap.get('comentario');
    if (preset) {
      this.commentControl.setValue(preset);
    }
    this.commentControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.serverFieldError = null;
      });
    this.load();
  }

  /** Carga (o recarga) el detalle sin tocar el comentario introducido. */
  load(): void {
    this.loading = true;
    this.loadError = false;
    this.service.detail(this.id).subscribe({
      next: (incident) => {
        this.incident = incident;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.cdr.markForCheck();
      },
    });
  }

  confirm(): void {
    if (this.submitting) return;
    this.commentControl.markAsTouched();
    if (this.commentControl.invalid || !this.isResolved) return;
    this.submitting = true;
    this.submitError = null;
    this.serverFieldError = null;
    this.service.close(this.id, this.commentControl.value).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/incidencias', this.id, 'resolucion'], {
          state: { closed: true },
        });
      },
      error: (err: unknown) => {
        this.submitting = false;
        this.handleError(err);
        this.cdr.markForCheck();
      },
    });
  }

  cancel(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/mis-incidencias', this.id]);
    }
  }

  private handleError(err: unknown): void {
    const status = err instanceof HttpErrorResponse ? err.status : 0;
    if (status === 400) {
      this.serverFieldError = backendMessage(err) ?? MSG_COMMENT_REQUIRED;
    } else if (status === 409) {
      this.submitError = MSG_NOT_RESOLVED;
      this.load();
    } else if (status === 403) {
      this.submitError = MSG_FORBIDDEN;
    } else {
      this.submitError = MSG_CLOSE_FAILED;
    }
  }
}

function backendMessage(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const body: unknown = err.error;
  if (typeof body === 'object' && body !== null) {
    const r = body as Record<string, unknown>;
    const msg = r['message'] ?? r['detail'];
    if (typeof msg === 'string' && msg.trim() !== '') return msg;
  }
  return null;
}
