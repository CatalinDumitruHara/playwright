import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bDropDownSelectComponent,
  B2bListBasicComponent,
  B2bListComponent,
  B2bNotificationInlineComponent,
  B2bSpinnerComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentTrayService } from '../../incident-tray.service';
import { TrayHistoryEntry, trayErrorMessage } from '../../incident-tray.models';

export const ALL_ENTRY_TYPES = 'TODAS';
export const LOAD_ERROR_FALLBACK = 'No se ha podido cargar la información de la incidencia';

export interface EntryTypeOption {
  code: string;
  label: string;
}

export const ENTRY_TYPE_OPTIONS: EntryTypeOption[] = [
  { code: ALL_ENTRY_TYPES, label: 'Todas' },
  { code: 'ASIGNACION', label: 'Asignación' },
  { code: 'REASIGNACION', label: 'Reasignación' },
  { code: 'LIBERACION', label: 'Liberación' },
];

function normalizeType(v: string | null | undefined): string {
  return (v ?? '').trim().toUpperCase();
}

export function entryTypeLabel(v: string | null | undefined): string {
  const code = normalizeType(v);
  if (!code) return 'Entrada';
  return ENTRY_TYPE_OPTIONS.find((o) => o.code === code && o.code !== ALL_ENTRY_TYPES)?.label ?? (v ?? '');
}

/** ARC-032 «Historial de la incidencia» — /incidencias/:id/historial/asignaciones (EP-029). */
@Component({
  selector: 'app-assignment-history-page',
  standalone: true,
  imports: [
    CommonModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bDropDownSelectComponent,
    B2bListComponent,
    B2bListBasicComponent,
    B2bNotificationInlineComponent,
    B2bSpinnerComponent,
  ],
  templateUrl: './assignment-history.page.html',
  styleUrl: './assignment-history.page.scss',
})
export class AssignmentHistoryPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(IncidentTrayService);
  private destroyRef = inject(DestroyRef);

  readonly filterOptions = ENTRY_TYPE_OPTIONS;

  readonly id = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly loaded = signal(false);
  readonly entries = signal<TrayHistoryEntry[]>([]);
  readonly selectedType = signal(ALL_ENTRY_TYPES);

  readonly visibleEntries = computed(() => {
    const type = this.selectedType();
    const all = this.entries();
    if (type === ALL_ENTRY_TYPES) return all;
    return all.filter((e) => normalizeType(e.entryType) === type);
  });

  readonly showEmpty = computed(
    () => this.loaded() && !this.loading() && this.errorMessage() === null && this.visibleEntries().length === 0
  );

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.id.set(params.get('id') ?? '');
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.loaded.set(false);
    this.errorMessage.set(null);
    this.service
      .history(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entries) => {
          this.entries.set(entries);
          this.loading.set(false);
          this.loaded.set(true);
        },
        error: (err: unknown) => {
          this.entries.set([]);
          this.loading.set(false);
          this.errorMessage.set(trayErrorMessage(err, LOAD_ERROR_FALLBACK));
        },
      });
  }

  onFilterChange(value: unknown): void {
    let code: string | null = null;
    if (typeof value === 'string') code = value;
    else if (value && typeof value === 'object' && 'code' in value) {
      code = String((value as EntryTypeOption).code);
    }
    const normalized = normalizeType(code);
    this.selectedType.set(
      ENTRY_TYPE_OPTIONS.some((o) => o.code === normalized) ? normalized : ALL_ENTRY_TYPES
    );
  }

  /** Línea de la entrada: tipo · origen → destino · autor · fecha-hora · motivo. */
  entryTitle(e: TrayHistoryEntry): string {
    const parts = [entryTypeLabel(e.entryType)];
    parts.push(`${e.fromTechnicianName || '—'} → ${e.toTechnicianName || '—'}`);
    parts.push(e.actorName || '—');
    parts.push(this.formatDateTime(e.changedAt));
    const reason = e.reason?.trim();
    if (reason) parts.push(`Motivo: ${reason}`);
    return parts.join(' · ');
  }

  private formatDateTime(iso: string): string {
    if (!iso || !Number.isFinite(Date.parse(iso))) return '—';
    return formatDate(iso, 'dd/MM/yyyy HH:mm', 'en-US');
  }

  backToDetail(): void {
    this.router.navigate(['/incidencias', this.id()]);
  }
}
