import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router, RouterModule } from '@angular/router';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bDropDownMultipleSelectComponent,
  B2bDropDownSelectComponent,
  B2bInputComponent,
  B2bLabelComponent,
  B2bLinkComponent,
  B2bNotificationInlineComponent,
  B2bPaginatorComponent,
  B2bSpinnerComponent,
  B2bTableContainerComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentTrayService } from '../../incident-tray.service';
import {
  ASSIGNMENT_FILTERS,
  AssignmentFilter,
  DEFAULT_TRAY_PAGE_SIZE,
  DEFAULT_TRAY_SORT_BY,
  DEFAULT_TRAY_SORT_DIR,
  SEARCH_TEXT_MAX,
  SEARCH_TEXT_MIN,
  TRAY_PAGE_SIZES,
  TRAY_SORT_BY,
  TrayPageSize,
  TrayQuery,
  TrayRow,
  TraySortBy,
  TraySortDir,
  UNASSIGNED_LABEL,
  trayErrorMessage,
} from '../../incident-tray.models';
import { INCIDENT_STATUSES, statusLabel } from '../../../my-incidents/my-incidents.models';
import { ReportIncidentService } from '../../../report-incident/report-incident.service';

export interface TrayFilterOption {
  value: string;
  label: string;
}

/** Estado de filtros/orden/página tal y como se refleja en la URL. */
interface TrayState {
  search_text: string;
  room_id: string[];
  office_id: string;
  category_code: string[];
  status: string[];
  assignment_filter: AssignmentFilter;
  created_from: string;
  created_to: string;
  sort_by: TraySortBy;
  sort_dir: TraySortDir;
  page: number;
  page_size: TrayPageSize;
}

export const TRAY_SEARCH_HINT = 'Introduce al menos 3 caracteres';
export const TRAY_SEARCH_TOO_LONG = 'La búsqueda no puede superar los 100 caracteres';
export const TRAY_DATE_ORDER_ERROR = 'La fecha de inicio no puede ser posterior a la de fin';
export const TRAY_DATE_RANGE_ERROR = 'El rango máximo consultable es de 2 años';
export const TRAY_LIST_ERROR = 'No se ha podido recuperar el listado, inténtalo de nuevo';
export const TRAY_CATALOG_ERROR = 'No se han podido cargar los catálogos de filtros, reintenta';
export const TRAY_EMPTY_MESSAGE = 'No hay incidencias que cumplan los filtros seleccionados';

const DEFAULT_ASSIGNMENT: AssignmentFilter = 'TODAS';

const SORT_BY_LABELS: Record<TraySortBy, string> = {
  created_at: 'Fecha de alta',
  updated_at: 'Última modificación',
  status: 'Estado',
  room_name: 'Sala',
  category_name: 'Categoría',
  age_days: 'Antigüedad',
};

const STATUS_TAG_CLASS: Record<string, string> = {
  ABIERTA: 'b2b--blue',
  EN_CURSO: 'b2b--orange',
  RESUELTA: 'b2b--green',
  CERRADA: 'b2b--grey',
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isSortBy(v: string | null): v is TraySortBy {
  return v !== null && (TRAY_SORT_BY as readonly string[]).includes(v);
}

function isSortDir(v: string | null): v is TraySortDir {
  return v === 'ASC' || v === 'DESC';
}

function isAssignment(v: string | null): v is AssignmentFilter {
  return v !== null && ASSIGNMENT_FILTERS.some((f) => f.code === v);
}

function toPageSize(v: number): TrayPageSize {
  return (TRAY_PAGE_SIZES as readonly number[]).includes(v)
    ? (v as TrayPageSize)
    : DEFAULT_TRAY_PAGE_SIZE;
}

function clean(values: readonly string[]): string[] {
  return values.map((v) => v.trim()).filter((v) => v !== '');
}

function cleanDate(v: string | null | undefined): string {
  const s = (v ?? '').trim();
  return DATE_RE.test(s) ? s : '';
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** yyyy-MM-dd + 2 años (29/02 → 28/02 si el año destino no es bisiesto). */
function plusTwoYears(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y + 2, m - 1, d);
  if (target.getMonth() !== m - 1) target.setDate(0);
  return isoDate(target);
}

@Component({
  selector: 'app-incident-tray-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bDropDownMultipleSelectComponent,
    B2bDropDownSelectComponent,
    B2bInputComponent,
    B2bLabelComponent,
    B2bLinkComponent,
    B2bNotificationInlineComponent,
    B2bPaginatorComponent,
    B2bSpinnerComponent,
    B2bTableContainerComponent,
    B2bTagComponent,
  ],
  templateUrl: './incident-tray.page.html',
  styleUrl: './incident-tray.page.scss',
})
export class IncidentTrayPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private tray = inject(IncidentTrayService);
  private reportIncident = inject(ReportIncidentService);

  readonly searchMax = SEARCH_TEXT_MAX;
  readonly unassignedLabel = UNASSIGNED_LABEL;
  readonly emptyMessage = TRAY_EMPTY_MESSAGE;
  readonly pageSizeOptions: number[] = [...TRAY_PAGE_SIZES];

  readonly statusOptions: TrayFilterOption[] = INCIDENT_STATUSES.map((s) => ({
    value: s.code,
    label: s.label,
  }));
  readonly assignmentOptions: TrayFilterOption[] = ASSIGNMENT_FILTERS.map((f) => ({
    value: f.code,
    label: f.label,
  }));
  readonly sortByOptions: TrayFilterOption[] = TRAY_SORT_BY.map((v) => ({
    value: v,
    label: SORT_BY_LABELS[v],
  }));
  readonly sortDirOptions: TrayFilterOption[] = [
    { value: 'DESC', label: 'Descendente' },
    { value: 'ASC', label: 'Ascendente' },
  ];

  readonly categoryOptions = signal<TrayFilterOption[]>([]);
  readonly roomOptions = signal<TrayFilterOption[]>([]);
  readonly officeOptions = signal<TrayFilterOption[]>([]);
  readonly catalogError = signal<string | null>(null);

  readonly form = new FormGroup({
    search_text: new FormControl<string>('', { nonNullable: true }),
    room_id: new FormControl<string[]>([], { nonNullable: true }),
    office_id: new FormControl<string | null>(null),
    category_code: new FormControl<string[]>([], { nonNullable: true }),
    status: new FormControl<string[]>([], { nonNullable: true }),
    assignment_filter: new FormControl<string | null>(DEFAULT_ASSIGNMENT),
    created_from: new FormControl<string>('', { nonNullable: true }),
    created_to: new FormControl<string>('', { nonNullable: true }),
    sort_by: new FormControl<string | null>(DEFAULT_TRAY_SORT_BY),
    sort_dir: new FormControl<string | null>(DEFAULT_TRAY_SORT_DIR),
  });

  readonly rows = signal<TrayRow[]>([]);
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal<number>(DEFAULT_TRAY_PAGE_SIZE);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly listError = signal<string | null>(null);
  readonly searchHint = signal<string | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly dateError = signal<string | null>(null);

  readonly pageIndex = computed(() => Math.max(0, this.currentPage() - 1));
  readonly isEmpty = computed(
    () => this.loaded() && !this.loading() && !this.listError() && this.rows().length === 0
  );
  readonly countLabel = computed(() => {
    const n = this.totalCount();
    return `${n} ${n === 1 ? 'incidencia encontrada' : 'incidencias encontradas'}`;
  });

  private applied: TrayState = this.parse(this.route.snapshot.queryParamMap);

  constructor() {
    this.loadFilterCatalogs();

    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const state = this.parse(params);
          this.patchForm(state);
          if (!this.validate(state)) {
            // No se consulta: el listado previo permanece visible.
            this.loading.set(false);
            return EMPTY;
          }
          this.applied = state;
          this.currentPage.set(state.page);
          this.pageSize.set(state.page_size);
          this.listError.set(null);
          this.loading.set(true);
          return this.tray.list(this.toQuery(state)).pipe(
            tap((result) => {
              this.rows.set(result.items);
              this.totalCount.set(result.totalCount);
              this.loading.set(false);
              this.loaded.set(true);
            }),
            catchError((err: unknown) => {
              this.rows.set([]);
              this.totalCount.set(0);
              this.loading.set(false);
              this.loaded.set(true);
              this.listError.set(trayErrorMessage(err, TRAY_LIST_ERROR));
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  statusLabel(code: string): string {
    return statusLabel(code);
  }

  statusTagClass(code: string): string {
    return STATUS_TAG_CLASS[code] ?? 'b2b--grey';
  }

  trackById(_: number, row: TrayRow): string {
    return row.incidentId;
  }

  /** Aplica filtros, búsqueda y orden del formulario; vuelve a la página 1. */
  applyFilters(): void {
    const state: TrayState = { ...this.readForm(), page: 1, page_size: toPageSize(this.pageSize()) };
    if (!this.validate(state)) return;
    this.navigate(state);
  }

  /** Restablece filtros, orden y página por defecto (la URL queda sin parámetros). */
  clearFilters(): void {
    this.searchHint.set(null);
    this.searchError.set(null);
    this.dateError.set(null);
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  /** Atajos de fecha: solo rellenan desde/hasta, no consultan. */
  setToday(): void {
    const today = isoDate(new Date());
    this.setDates(today, today);
  }

  setLast7Days(): void {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    this.setDates(isoDate(from), isoDate(today));
  }

  setCurrentMonth(): void {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    this.setDates(isoDate(from), isoDate(today));
  }

  /** Navega a la página n (1-based) manteniendo los filtros aplicados. */
  goToPage(n: number): void {
    const page = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    if (page === this.currentPage()) return;
    this.navigate({ ...this.applied, page });
  }

  onPageIndexChange(index: number): void {
    this.goToPage(index + 1);
  }

  onPageSizeChange(size: number): void {
    const pageSize = toPageSize(size);
    if (pageSize === this.applied.page_size) return;
    this.navigate({ ...this.applied, page: 1, page_size: pageSize });
  }

  private setDates(from: string, to: string): void {
    this.form.patchValue({ created_from: from, created_to: to });
    this.dateError.set(null);
  }

  private navigate(state: TrayState): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toQueryParams(state),
    });
  }

  /** Mismos catálogos (y endpoints) que «Mis incidencias». */
  private loadFilterCatalogs(): void {
    this.reportIncident
      .loadCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) =>
          this.categoryOptions.set(categories.map((c) => ({ value: c.code, label: c.name }))),
        error: () => this.catalogError.set(TRAY_CATALOG_ERROR),
      });

    this.reportIncident
      .loadRooms()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rooms) => {
          this.roomOptions.set(rooms.map((r) => ({ value: String(r.id), label: r.name })));
          const offices = new Map<string, string>();
          for (const r of rooms) {
            if (r.officeId === null) continue;
            const id = String(r.officeId);
            if (!offices.has(id)) offices.set(id, r.officeName || id);
          }
          this.officeOptions.set(
            [...offices.entries()]
              .map(([value, label]) => ({ value, label }))
              .sort((a, b) => a.label.localeCompare(b.label, 'es'))
          );
        },
        error: () => this.catalogError.set(TRAY_CATALOG_ERROR),
      });
  }

  /** Lee la URL; los parámetros desconocidos o inválidos se ignoran. */
  private parse(params: ParamMap): TrayState {
    const sortBy = params.get('sort_by');
    const sortDir = params.get('sort_dir');
    const assignment = params.get('assignment_filter');
    const page = Number(params.get('page'));
    const statuses = INCIDENT_STATUSES.map((s) => s.code);
    return {
      search_text: params.get('search_text') ?? '',
      room_id: clean(params.getAll('room_id')),
      office_id: (params.get('office_id') ?? '').trim(),
      category_code: clean(params.getAll('category_code')),
      status: clean(params.getAll('status')).filter((s) => statuses.includes(s)),
      assignment_filter: isAssignment(assignment) ? assignment : DEFAULT_ASSIGNMENT,
      created_from: cleanDate(params.get('created_from')),
      created_to: cleanDate(params.get('created_to')),
      sort_by: isSortBy(sortBy) ? sortBy : DEFAULT_TRAY_SORT_BY,
      sort_dir: isSortDir(sortDir) ? sortDir : DEFAULT_TRAY_SORT_DIR,
      page: Number.isInteger(page) && page >= 1 ? page : 1,
      page_size: toPageSize(Number(params.get('page_size'))),
    };
  }

  private readForm(): Omit<TrayState, 'page' | 'page_size'> {
    const v = this.form.getRawValue();
    return {
      search_text: v.search_text ?? '',
      room_id: clean(v.room_id ?? []),
      office_id: (v.office_id ?? '').trim(),
      category_code: clean(v.category_code ?? []),
      status: clean(v.status ?? []),
      assignment_filter: isAssignment(v.assignment_filter) ? v.assignment_filter : DEFAULT_ASSIGNMENT,
      created_from: cleanDate(v.created_from),
      created_to: cleanDate(v.created_to),
      sort_by: isSortBy(v.sort_by) ? v.sort_by : DEFAULT_TRAY_SORT_BY,
      sort_dir: isSortDir(v.sort_dir) ? v.sort_dir : DEFAULT_TRAY_SORT_DIR,
    };
  }

  private patchForm(state: TrayState): void {
    this.form.setValue(
      {
        search_text: state.search_text,
        room_id: [...state.room_id],
        office_id: state.office_id || null,
        category_code: [...state.category_code],
        status: [...state.status],
        assignment_filter: state.assignment_filter,
        created_from: state.created_from,
        created_to: state.created_to,
        sort_by: state.sort_by,
        sort_dir: state.sort_dir,
      },
      { emitEvent: false }
    );
  }

  /**
   * Devuelve false si NO debe consultarse (búsqueda > 100 o fechas inválidas).
   * Una búsqueda de 1-2 caracteres solo muestra aviso: se consulta sin ella.
   */
  private validate(state: TrayState): boolean {
    const text = state.search_text.trim();
    const tooLong = text.length > SEARCH_TEXT_MAX;
    this.searchError.set(tooLong ? TRAY_SEARCH_TOO_LONG : null);
    this.searchHint.set(
      text !== '' && text.length < SEARCH_TEXT_MIN ? TRAY_SEARCH_HINT : null
    );

    let dateError: string | null = null;
    const { created_from: from, created_to: to } = state;
    if (from && to) {
      if (from > to) dateError = TRAY_DATE_ORDER_ERROR;
      else if (to > plusTwoYears(from)) dateError = TRAY_DATE_RANGE_ERROR;
    }
    this.dateError.set(dateError);

    return !tooLong && dateError === null;
  }

  private toQuery(s: TrayState): TrayQuery {
    const q: TrayQuery = {
      sort_by: s.sort_by,
      sort_dir: s.sort_dir,
      page: s.page,
      page_size: s.page_size,
    };
    const text = s.search_text.trim();
    if (text.length >= SEARCH_TEXT_MIN && text.length <= SEARCH_TEXT_MAX) q.search_text = text;
    if (s.room_id.length) q.room_id = s.room_id;
    if (s.office_id) q.office_id = s.office_id;
    if (s.category_code.length) q.category_code = s.category_code;
    if (s.status.length) q.status = s.status;
    if (s.assignment_filter !== DEFAULT_ASSIGNMENT) q.assignment_filter = s.assignment_filter;
    if (s.created_from) q.created_from = s.created_from;
    if (s.created_to) q.created_to = s.created_to;
    return q;
  }

  /** Arrays como parámetros repetidos; los valores por defecto no se escriben. */
  private toQueryParams(s: TrayState): Params {
    const p: Params = {};
    const text = s.search_text.trim();
    if (text) p['search_text'] = text;
    if (s.room_id.length) p['room_id'] = s.room_id;
    if (s.office_id) p['office_id'] = s.office_id;
    if (s.category_code.length) p['category_code'] = s.category_code;
    if (s.status.length) p['status'] = s.status;
    if (s.assignment_filter !== DEFAULT_ASSIGNMENT) p['assignment_filter'] = s.assignment_filter;
    if (s.created_from) p['created_from'] = s.created_from;
    if (s.created_to) p['created_to'] = s.created_to;
    if (s.sort_by !== DEFAULT_TRAY_SORT_BY) p['sort_by'] = s.sort_by;
    if (s.sort_dir !== DEFAULT_TRAY_SORT_DIR) p['sort_dir'] = s.sort_dir;
    if (s.page > 1) p['page'] = s.page;
    if (s.page_size !== DEFAULT_TRAY_PAGE_SIZE) p['page_size'] = s.page_size;
    return p;
  }
}
