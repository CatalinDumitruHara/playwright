import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bDropDownSelectComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { MyIncidentsService } from '../../my-incidents.service';
import { HistoryEntry, INCIDENT_STATUSES, statusLabel } from '../../my-incidents.models';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Formatea un tiempo de permanencia en ms («2 d 3 h», «3 h 15 min», «12 min», «menos de 1 min»). null → «En curso». */
export function formatDwell(ms: number | null): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return 'En curso';
  if (ms < MINUTE) return 'menos de 1 min';
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return `${minutes} min`;
}

export const ALL_STATUSES = 'TODOS';

interface StatusFilterOption {
  code: string;
  label: string;
}

@Component({
  selector: 'app-incident-history-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bDropDownSelectComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
    B2bTagComponent,
  ],
  templateUrl: './incident-history.page.html',
  styleUrl: './incident-history.page.scss',
})
export class IncidentHistoryPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(MyIncidentsService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly filterOptions: StatusFilterOption[] = [
    { code: ALL_STATUSES, label: 'Todos' },
    ...INCIDENT_STATUSES.map((s) => ({ code: s.code, label: s.label })),
  ];

  id = '';
  loading = false;
  error = false;
  entries: HistoryEntry[] = [];
  selectedStatus = ALL_STATUSES;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service
      .history(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entries) => {
          this.entries = entries;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          this.loading = false;
          const status = err instanceof HttpErrorResponse ? err.status : 0;
          if (status === 404 || status === 403) {
            this.router.navigate(['/incidencias/no-encontrada'], {
              queryParams: { id: this.id },
            });
            return;
          }
          this.error = true;
          this.cdr.markForCheck();
        },
      });
  }

  get visibleEntries(): HistoryEntry[] {
    if (this.selectedStatus === ALL_STATUSES) return this.entries;
    return this.entries.filter((e) => e.toStatus === this.selectedStatus);
  }

  onFilterChange(value: unknown): void {
    let code: string | null = null;
    if (typeof value === 'string') code = value;
    else if (value && typeof value === 'object' && 'code' in value) {
      code = String((value as StatusFilterOption).code);
    }
    this.selectedStatus = code && code !== '' ? code : ALL_STATUSES;
    this.cdr.markForCheck();
  }

  fromLabel(entry: HistoryEntry): string {
    return statusLabel(entry.fromStatus) || 'Alta';
  }

  toLabel(entry: HistoryEntry): string {
    return statusLabel(entry.toStatus);
  }

  dwell(entry: HistoryEntry): string {
    return formatDwell(entry.dwellMs);
  }

  backToDetail(): void {
    this.router.navigate(['/mis-incidencias', this.id]);
  }
}
