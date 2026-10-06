import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bDropDownSelectComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
  B2bTextAreaComponent,
} from '@mapfre-tech/b2b-components';
import { ClassificationUpdateRequest } from '@api-types';
import { IncidentTrayService } from '../../incident-tray.service';
import { ReclassificationOption } from '../../incident-tray.models';
import { IncidentView } from '../../../my-incidents/my-incidents.models';

export const RECLASSIFY_REASON_MAX_LENGTH = 255;
export const MSG_RECLASSIFY_NO_CHANGE = 'Debe modificarse al menos la sala o la categoría';
export const MSG_RECLASSIFY_CLOSED = 'No se puede reclasificar una incidencia cerrada';
export const MSG_RECLASSIFY_FORBIDDEN = 'No tiene permisos para realizar esta operación';
export const MSG_RECLASSIFY_INVALID = 'La sala o la categoría seleccionada no es válida';
export const MSG_RECLASSIFY_FAILED =
  'No se ha podido completar la reclasificación; inténtelo de nuevo';

interface SummaryLine {
  field: 'Sala' | 'Categoría';
  from: string;
  to: string;
}

/** ARC-039 · Reclasificación de sala y categoría. */
@Component({
  selector: 'app-reclassify-incident-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bDropDownSelectComponent,
    B2bLabelComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
    B2bTextAreaComponent,
  ],
  templateUrl: './reclassify-incident.page.html',
  styleUrl: './reclassify-incident.page.scss',
})
export class ReclassifyIncidentPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private service = inject(IncidentTrayService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly maxLength = RECLASSIFY_REASON_MAX_LENGTH;
  readonly msgNoChange = MSG_RECLASSIFY_NO_CHANGE;
  readonly msgClosed = MSG_RECLASSIFY_CLOSED;

  id = '';
  incident: IncidentView | null = null;
  roomOptions: ReclassificationOption[] = [];
  categoryOptions: ReclassificationOption[] = [];
  loading = false;
  loadError = false;
  submitting = false;
  submitError: string | null = null;

  readonly form = new FormGroup({
    roomId: new FormControl<string | null>(null),
    categoryCode: new FormControl<string | null>(null),
    reason: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(RECLASSIFY_REASON_MAX_LENGTH)],
    }),
  });

  get isClosed(): boolean {
    return (this.incident?.statusCode ?? '').toUpperCase() === 'CERRADA';
  }

  get reasonLength(): number {
    return this.form.controls.reason.value?.length ?? 0;
  }

  get selectedRoom(): ReclassificationOption | null {
    const v = this.form.controls.roomId.value;
    return v ? this.roomOptions.find((o) => o.value === v) ?? null : null;
  }

  get selectedCategory(): ReclassificationOption | null {
    const v = this.form.controls.categoryCode.value;
    return v ? this.categoryOptions.find((o) => o.value === v) ?? null : null;
  }

  /** Sala seleccionada y distinta de la actual. */
  get roomChanged(): boolean {
    const opt = this.selectedRoom;
    return !!opt && !this.sameRoom(opt.label);
  }

  /** Categoría seleccionada y distinta de la actual. */
  get categoryChanged(): boolean {
    const opt = this.selectedCategory;
    return !!opt && !sameText(opt.label, this.incident?.categoryName);
  }

  get hasChange(): boolean {
    return this.roomChanged || this.categoryChanged;
  }

  get summary(): SummaryLine[] {
    const lines: SummaryLine[] = [];
    if (this.roomChanged && this.selectedRoom) {
      lines.push({ field: 'Sala', from: this.incident?.roomName || '—', to: this.selectedRoom.label });
    }
    if (this.categoryChanged && this.selectedCategory) {
      lines.push({
        field: 'Categoría',
        from: this.incident?.categoryName || '—',
        to: this.selectedCategory.label,
      });
    }
    return lines;
  }

  get confirmDisabled(): boolean {
    return this.submitting || !this.hasChange || this.form.controls.reason.invalid || this.isClosed;
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.cdr.markForCheck();
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    forkJoin({
      incident: this.service.detail(this.id),
      rooms: this.service.rooms(),
      categories: this.service.categories(),
    }).subscribe({
      next: ({ incident, rooms, categories }) => {
        this.incident = incident;
        this.roomOptions = rooms;
        this.categoryOptions = categories;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.loading = false;
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.goNotFound();
          return;
        }
        this.loadError = true;
        this.cdr.markForCheck();
      },
    });
  }

  confirm(): void {
    if (this.submitting || this.confirmDisabled) return;
    const body: ClassificationUpdateRequest = {};
    const room = this.selectedRoom;
    const category = this.selectedCategory;
    if (this.roomChanged && room) body.room_id = Number(room.value);
    if (this.categoryChanged && category) body.category_code = category.value;
    const reason = this.form.controls.reason.value;
    if (reason) body.reason = reason;

    this.submitting = true;
    this.submitError = null;
    this.service.reclassify(this.id, body).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/incidencias', this.id, 'historial', 'reclasificaciones'], {
          state: { reclassified: true },
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

  private sameRoom(label: string): boolean {
    const name = this.incident?.roomName;
    if (!name) return false;
    const office = this.incident?.officeName;
    return (
      sameText(label, name) ||
      (!!office && sameText(label, `${name} · ${office}`))
    );
  }

  private goNotFound(): void {
    this.router.navigate(['/incidencias/no-encontrada'], { queryParams: { id: this.id } });
  }

  private handleError(err: unknown): void {
    const status = err instanceof HttpErrorResponse ? err.status : 0;
    if (status === 403) {
      this.submitError = MSG_RECLASSIFY_FORBIDDEN;
    } else if (status === 404) {
      this.goNotFound();
    } else if (status === 409) {
      this.submitError = MSG_RECLASSIFY_CLOSED;
    } else if (status === 422) {
      this.submitError = backendMessage(err) ?? MSG_RECLASSIFY_INVALID;
    } else {
      this.submitError = MSG_RECLASSIFY_FAILED;
    }
  }
}

function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();
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
