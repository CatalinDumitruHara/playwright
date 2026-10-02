import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  ParamMap,
  Params,
  Router,
  RouterModule,
} from '@angular/router';
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
import { MyIncidentsService } from '../../my-incidents.service';
import {
  DEFAULT_PAGE_SIZE,
  INCIDENT_STATUSES,
  IncidentRow,
  MyIncidentsQuery,
  SORT_BY_VALUES,
  SortBy,
  statusLabel,
} from '../../my-incidents.models';
import { ReportIncidentService } from '../../../report-incident/report-incident.service';

export interface FilterOption {
  value: string;
  label: string;
}

type SortDir = 'asc' | 'desc';

/** Estado de filtros/orden/página tal y como se refleja en la URL. */
interface ListState {
  search_text: string;
  status_code: string[];
  category_id: string[];
  room_id: string[];
  office_id: string;
  created_from: string;
  created_to: string;
  sort_by: SortBy | null;
  sort_dir: SortDir | null;
  page: number;
}

export const SEARCH_MIN = 2;
export const SEARCH_MAX = 100;
export const SEARCH_ERROR = 'Introduce al menos 2 caracteres para buscar';
export const DATE_RANGE_ERROR = 'La fecha de inicio no puede ser posterior a la de fin';
export const BAD_REQUEST_FALLBACK = 'Parámetros de consulta no válidos';
export const CATALOG_ERROR =
  'No se han podido cargar los catálogos de filtros, reintenta';
export const LIST_ERROR =
  'No se ha podido recuperar tu listado de incidencias. Inténtalo de nuevo';

const SORT_BY_LABELS: Record<SortBy, string> = {
  created_at: 'Fecha de alta',
  updated_at: 'Última actualización',
  status_code: 'Estado',
};

function isSortBy(v: string | null): v is SortBy {
  return v !== null && (SORT_BY_VALUES as readonly string[]).includes(v);
}

function isSortDir(v: string | null): v is SortDir {
  return v === 'asc' || v === 'desc';
}

function clean(values: string[]): string[] {
  return values.map((v) => v.trim()).filter((v) => v !== '');
}

@Component({
  selector: 'app-my-incidents-list-page',
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
  templateUrl: './my-incidents-list.page.html',
  styleUrl: './my-incidents-list.page.scss',
})
export class MyIncidentsListPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private myIncidents = inject(MyIncidentsService);
  private reportIncident = inject(ReportIncidentService);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly pageSizeOptions = [DEFAULT_PAGE_SIZE];

  readonly statusOptions: FilterOption[] = INCIDENT_STATUSES.map((s) => ({
    value: s.code,
    label: s.label,
  }));
  readonly sortByOptions: FilterOption[] = SORT_BY_VALUES.map((v) => ({
    value: v,
    label: SORT_BY_LABELS[v],
  }));
  readonly sortDirOptions: FilterOption[] = [
    { value: 'asc', label: 'Ascendente' },
    { value: 'desc', label: 'Descendente' },
  ];

  readonly categoryOptions = signal<FilterOption[]>([]);
  readonly roomOptions = signal<FilterOption[]>([]);
  readonly officeOptions = signal<FilterOption[]>([]);
  readonly catalogError = signal<string | null>(null);

  readonly form = new FormGroup({
    search_text: new FormControl<string>('', { nonNullable: true }),
    status_code: new FormControl<string[]>([], { nonNullable: true }),
    category_id: new FormControl<string[]>([], { nonNullable: true }),
    room_id: new FormControl<string[]>([], { nonNullable: true }),
    office_id: new FormControl<string | null>(null),
    created_from: new FormControl<string>('', { nonNullable: true }),
    created_to: new FormControl<string>('', { nonNullable: true }),
    sort_by: new FormControl<string | null>(null),
    sort_dir: new FormControl<string | null>(null),
  });

  /** Página actual (1-based), leída de la URL. */
  readonly currentPage = signal(1);
  readonly rows = signal<IncidentRow[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly listError = signal<string | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly dateError = signal<string | null>(null);
  /** Hay filtros aplicados (en la URL), excluyendo orden y página. */
  readonly hasFilters = signal(false);

  readonly pageIndex = computed(() => Math.max(0, this.currentPage() - 1));
  readonly isEmpty = computed(
    () => this.loaded() && !this.loading() && !this.listError() && this.rows().length === 0
  );

  private applied: ListState = this.parse(this.route.snapshot.queryParamMap);

  constructor() {
    this.loadFilterCatalogs();

    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const state = this.parse(params);
          this.applied = state;
          this.currentPage.set(state.page);
          this.hasFilters.set(this.stateHasFilters(state));
          this.patchForm(state);
          this.listError.set(null);
          if (!this.validate(state)) {
            this.loading.set(false);
            return EMPTY;
          }
          this.loading.set(true);
          return this.myIncidents.list(this.toQuery(state)).pipe(
            tap((result) => {
              this.rows.set(result.items);
              this.total.set(result.total);
              this.loading.set(false);
              this.loaded.set(true);
            }),
            catchError((err: unknown) => {
              this.rows.set([]);
              this.total.set(0);
              this.loading.set(false);
              this.loaded.set(true);
              this.listError.set(this.errorMessage(err));
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

  trackById(_: number, row: IncidentRow): string {
    return row.incidentId;
  }

  /** Aplica filtros, búsqueda y orden del formulario; vuelve a la página 1. */
  applyFilters(): void {
    const state = this.readForm();
    if (!this.validate(state)) return;
    this.currentPage.set(1);
    this.navigate({ ...state, page: 1 });
  }

  /** Quita todos los filtros, orden y página de la URL. */
  clearFilters(): void {
    this.searchError.set(null);
    this.dateError.set(null);
    this.currentPage.set(1);
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  /** Navega a la página n (1-based) manteniendo los filtros aplicados. */
  goToPage(n: number): void {
    const page = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    if (page === this.currentPage()) return;
    this.currentPage.set(page);
    this.navigate({ ...this.applied, page });
  }

  onPageIndexChange(index: number): void {
    this.goToPage(index + 1);
  }

  newIncident(): void {
    this.router.navigate(['/incidencias/nueva']);
  }

  private navigate(state: ListState): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toQueryParams(state),
    });
  }

  private loadFilterCatalogs(): void {
    // Se incluyen también las inactivas: siguen siendo filtrables por uso histórico.
    this.reportIncident
      .loadCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) =>
          this.categoryOptions.set(categories.map((c) => ({ value: c.code, label: c.name }))),
        error: () => this.catalogError.set(CATALOG_ERROR),
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
        error: () => this.catalogError.set(CATALOG_ERROR),
      });
  }

  private parse(params: ParamMap): ListState {
    const sortBy = params.get('sort_by');
    const sortDir = params.get('sort_dir');
    const page = Number(params.get('page'));
    return {
      search_text: params.get('search_text') ?? '',
      status_code: clean(params.getAll('status_code')),
      category_id: clean(params.getAll('category_id')),
      room_id: clean(params.getAll('room_id')),
      office_id: (params.get('office_id') ?? '').trim(),
      created_from: (params.get('created_from') ?? '').trim(),
      created_to: (params.get('created_to') ?? '').trim(),
      sort_by: isSortBy(sortBy) ? sortBy : null,
      sort_dir: isSortDir(sortDir) ? sortDir : null,
      page: Number.isInteger(page) && page >= 1 ? page : 1,
    };
  }

  private readForm(): ListState {
    const v = this.form.getRawValue();
    return {
      search_text: v.search_text ?? '',
      status_code: clean(v.status_code ?? []),
      category_id: clean(v.category_id ?? []),
      room_id: clean(v.room_id ?? []),
      office_id: (v.office_id ?? '').trim(),
      created_from: (v.created_from ?? '').trim(),
      created_to: (v.created_to ?? '').trim(),
      sort_by: isSortBy(v.sort_by) ? v.sort_by : null,
      sort_dir: isSortDir(v.sort_dir) ? v.sort_dir : null,
      page: 1,
    };
  }

  private patchForm(state: ListState): void {
    this.form.setValue(
      {
        search_text: state.search_text,
        status_code: [...state.status_code],
        category_id: [...state.category_id],
        room_id: [...state.room_id],
        office_id: state.office_id || null,
        created_from: state.created_from,
        created_to: state.created_to,
        sort_by: state.sort_by,
        sort_dir: state.sort_dir,
      },
      { emitEvent: false }
    );
  }

  private validate(state: ListState): boolean {
    const text = state.search_text.trim();
    const searchOk = text === '' || (text.length >= SEARCH_MIN && text.length <= SEARCH_MAX);
    this.searchError.set(searchOk ? null : SEARCH_ERROR);

    const dateOk =
      !state.created_from || !state.created_to || state.created_from <= state.created_to;
    this.dateError.set(dateOk ? null : DATE_RANGE_ERROR);

    return searchOk && dateOk;
  }

  private stateHasFilters(s: ListState): boolean {
    return (
      s.search_text.trim() !== '' ||
      s.status_code.length > 0 ||
      s.category_id.length > 0 ||
      s.room_id.length > 0 ||
      s.office_id !== '' ||
      s.created_from !== '' ||
      s.created_to !== ''
    );
  }

  /** Nunca incluye identificador de usuario: el backend lo deriva de la sesión. */
  private toQuery(s: ListState): MyIncidentsQuery {
    const q: MyIncidentsQuery = { page: s.page, page_size: this.pageSize };
    const text = s.search_text.trim();
    if (text) q.search_text = text;
    if (s.status_code.length) q.status_code = s.status_code;
    if (s.category_id.length) q.category_id = s.category_id;
    if (s.room_id.length) q.room_id = s.room_id;
    if (s.office_id) q.office_id = s.office_id;
    if (s.created_from) q.created_from = s.created_from;
    if (s.created_to) q.created_to = s.created_to;
    if (s.sort_by) q.sort_by = s.sort_by;
    if (s.sort_dir) q.sort_dir = s.sort_dir;
    return q;
  }

  private toQueryParams(s: ListState): Params {
    const p: Params = {};
    const text = s.search_text.trim();
    if (text) p['search_text'] = text;
    if (s.status_code.length) p['status_code'] = s.status_code;
    if (s.category_id.length) p['category_id'] = s.category_id;
    if (s.room_id.length) p['room_id'] = s.room_id;
    if (s.office_id) p['office_id'] = s.office_id;
    if (s.created_from) p['created_from'] = s.created_from;
    if (s.created_to) p['created_to'] = s.created_to;
    if (s.sort_by) p['sort_by'] = s.sort_by;
    if (s.sort_dir) p['sort_dir'] = s.sort_dir;
    if (s.page > 1) p['page'] = s.page;
    return p;
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 400) {
      const body: unknown = err.error;
      const message =
        body && typeof body === 'object'
          ? (body as Record<string, unknown>)['message']
          : undefined;
      return typeof message === 'string' && message.trim() !== ''
        ? message
        : BAD_REQUEST_FALLBACK;
    }
    return LIST_ERROR;
  }
}
