import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bDropDownSelectComponent,
  B2bListComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentTrayService } from '../../incident-tray.service';
import {
  TIMELINE_EVENT_TYPES,
  TimelineEntry,
  TimelineEventType,
  isClosureEntry,
  timelineEventLabel,
} from '../../incident-tray.models';
import { IncidentView, statusLabel } from '../../../my-incidents/my-incidents.models';

export const FILTER_ALL = 'todos';
export const MSG_TIMELINE_FORBIDDEN = 'No tiene permiso para consultar esta incidencia.';
export const MSG_TIMELINE_NOT_FOUND = 'La incidencia no existe.';
export const MSG_TIMELINE_FAILED = 'No se ha podido cargar el historial.';
export const MSG_TIMELINE_FILTER_EMPTY = 'Sin eventos para el filtro seleccionado';
export const MSG_TIMELINE_NO_ACTIVITY = 'Sin actividad registrada.';

export interface TimelineFilterOption {
  value: string;
  label: string;
}

const DASH = '—';

function arrow(from: string | null, to: string | null): string {
  return `${from && from.trim() !== '' ? from : DASH} → ${to && to.trim() !== '' ? to : DASH}`;
}

/** Líneas de detalle de una entrada (texto plano, se interpolan). */
export function timelineDetail(e: TimelineEntry): string[] {
  switch (e.eventType) {
    case 'alta':
      return ['Alta de la incidencia'];
    case 'cambio_estado':
      return [arrow(statusLabel(e.fromValue), statusLabel(e.toValue))];
    case 'asignacion':
      return [`Técnico asignado: ${e.assignedTechnicianName || e.toValue || DASH}`];
    case 'reclasificacion': {
      const hasDetail =
        e.previousRoomName !== null ||
        e.newRoomName !== null ||
        e.previousCategoryName !== null ||
        e.newCategoryName !== null;
      if (!hasDetail) return [arrow(e.fromValue, e.toValue)];
      return [
        `Sala: ${arrow(e.previousRoomName, e.newRoomName)}`,
        `Categoría: ${arrow(e.previousCategoryName, e.newCategoryName)}`,
      ];
    }
    default:
      return [];
  }
}

/** ARC-056 · Historial consolidado de la incidencia (EP-028 + EP-029). */
@Component({
  selector: 'app-incident-timeline-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bDropDownSelectComponent,
    B2bListComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
    B2bTagComponent,
  ],
  templateUrl: './incident-timeline.page.html',
  styleUrl: './incident-timeline.page.scss',
})
export class IncidentTimelinePage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private service = inject(IncidentTrayService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly msgFilterEmpty = MSG_TIMELINE_FILTER_EMPTY;
  readonly msgNoActivity = MSG_TIMELINE_NO_ACTIVITY;
  readonly filterOptions: TimelineFilterOption[] = [
    { value: FILTER_ALL, label: 'Todos' },
    ...TIMELINE_EVENT_TYPES.map((t) => ({ value: t.code, label: t.label })),
  ];
  readonly filterControl = new FormControl<string>(FILTER_ALL, { nonNullable: true });

  id = '';
  incident: IncidentView | null = null;
  entries: TimelineEntry[] = [];
  visibleEntries: TimelineEntry[] = [];
  loading = false;
  loaded = false;
  error: string | null = null;
  retryable = false;

  get referenceCode(): string {
    return this.incident?.referenceCode || DASH;
  }

  get isEmptyTotal(): boolean {
    return this.loaded && !this.error && this.entries.length === 0;
  }

  get isEmptyFilter(): boolean {
    return (
      this.loaded && !this.error && this.entries.length > 0 && this.visibleEntries.length === 0
    );
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.filterControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyFilter();
        this.cdr.markForCheck();
      });
    this.loadDetail();
    this.loadTimeline();
  }

  loadDetail(): void {
    this.service.detail(this.id).subscribe({
      next: (incident) => {
        this.incident = incident;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        // La cabecera se mantiene; solo se refleja el error si es de acceso.
        const status = err instanceof HttpErrorResponse ? err.status : 0;
        if ((status === 403 || status === 404) && !this.error) {
          this.setError(status);
        }
        this.cdr.markForCheck();
      },
    });
  }

  loadTimeline(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = null;
    this.retryable = false;
    this.service.timeline(this.id).subscribe({
      next: (entries) => {
        this.entries = entries;
        this.applyFilter();
        this.loading = false;
        this.loaded = true;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.setError(err instanceof HttpErrorResponse ? err.status : 0);
        this.cdr.markForCheck();
      },
    });
  }

  private setError(status: number): void {
    if (status === 403) {
      this.error = MSG_TIMELINE_FORBIDDEN;
      this.retryable = false;
    } else if (status === 404) {
      this.error = MSG_TIMELINE_NOT_FOUND;
      this.retryable = false;
    } else {
      this.error = MSG_TIMELINE_FAILED;
      this.retryable = true;
    }
  }

  retry(): void {
    if (!this.incident) this.loadDetail();
    this.loadTimeline();
  }

  private applyFilter(): void {
    const f = this.filterControl.value;
    this.visibleEntries =
      !f || f === FILTER_ALL
        ? this.entries
        : this.entries.filter((e) => e.eventType === (f as TimelineEventType));
  }

  isCurrent(e: TimelineEntry): boolean {
    return this.entries.length > 0 && this.entries[this.entries.length - 1] === e;
  }

  eventLabel(e: TimelineEntry): string {
    return timelineEventLabel(e.eventType);
  }

  author(e: TimelineEntry): string {
    const name = e.actorName || DASH;
    return e.actorRole ? `${name} (${e.actorRole})` : name;
  }

  detailLines(e: TimelineEntry): string[] {
    return timelineDetail(e);
  }

  resolutionComment(e: TimelineEntry): string | null {
    return isClosureEntry(e) && e.resolutionComment ? e.resolutionComment : null;
  }

  trackById(index: number, e: TimelineEntry): string {
    return e.id || String(index);
  }

  print(): void {
    if (typeof window !== 'undefined') window.print();
  }

  back(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/incidencias', this.id, 'resolucion']);
    }
  }
}
