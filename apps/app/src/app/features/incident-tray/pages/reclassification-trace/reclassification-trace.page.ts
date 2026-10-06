import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
  B2bSpinnerComponent,
  B2bTableContainerComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentTrayService } from '../../incident-tray.service';
import { TimelineEntry } from '../../incident-tray.models';

export const MSG_TRACE_SUCCESS = 'Incidencia reclasificada correctamente';
export const MSG_TRACE_EMPTY = 'No hay reclasificaciones registradas para esta incidencia';
export const MSG_TRACE_FAILED = 'No se ha podido cargar el historial.';

export interface ReclassificationRow {
  id: string;
  previousRoom: string;
  newRoom: string;
  previousCategory: string;
  newCategory: string;
  author: string;
  occurredAt: string;
}

const EMPTY = '—';

function orDash(v: string | null | undefined): string {
  return v && v.trim() !== '' ? v : EMPTY;
}

/** Fila de traza; si el backend no informa sala/categoría, cae a from/to. */
export function toReclassificationRow(e: TimelineEntry): ReclassificationRow {
  const noDetail =
    e.previousRoomName === null &&
    e.newRoomName === null &&
    e.previousCategoryName === null &&
    e.newCategoryName === null;
  return {
    id: e.id,
    previousRoom: orDash(noDetail ? e.fromValue : e.previousRoomName),
    newRoom: orDash(noDetail ? e.toValue : e.newRoomName),
    previousCategory: orDash(e.previousCategoryName),
    newCategory: orDash(e.newCategoryName),
    author: orDash(e.actorName),
    occurredAt: e.occurredAt,
  };
}

/** ARC-040 · Traza de reclasificaciones (EP-029). */
@Component({
  selector: 'app-reclassification-trace-page',
  standalone: true,
  imports: [
    CommonModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bSpinnerComponent,
    B2bTableContainerComponent,
  ],
  templateUrl: './reclassification-trace.page.html',
  styleUrl: './reclassification-trace.page.scss',
})
export class ReclassificationTracePage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private service = inject(IncidentTrayService);
  private cdr = inject(ChangeDetectorRef);

  readonly msgSuccess = MSG_TRACE_SUCCESS;
  readonly msgEmpty = MSG_TRACE_EMPTY;

  id = '';
  showSuccess = false;
  loading = false;
  loaded = false;
  error: string | null = null;
  rows: ReclassificationRow[] = [];

  get isEmpty(): boolean {
    return this.loaded && !this.error && this.rows.length === 0;
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    const state =
      typeof history !== 'undefined' ? (history.state as Record<string, unknown> | null) : null;
    this.showSuccess = !!state?.['reclassified'];
    this.load();
  }

  load(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = null;
    this.service.timeline(this.id).subscribe({
      next: (entries) => {
        this.rows = entries
          .filter((e) => e.eventType === 'reclasificacion')
          .map(toReclassificationRow);
        this.loading = false;
        this.loaded = true;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.loading = false;
        const status = err instanceof HttpErrorResponse ? err.status : 0;
        if (status === 403 || status === 404) {
          this.router.navigate(['/incidencias/no-encontrada'], {
            queryParams: { id: this.id },
          });
        } else {
          this.error = MSG_TRACE_FAILED;
        }
        this.cdr.markForCheck();
      },
    });
  }

  retry(): void {
    this.load();
  }

  trackById(_: number, row: ReclassificationRow): string {
    return row.id;
  }

  back(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/mis-incidencias', this.id]);
    }
  }
}
