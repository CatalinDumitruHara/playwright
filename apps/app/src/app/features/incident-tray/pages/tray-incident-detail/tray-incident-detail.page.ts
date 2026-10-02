import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bLinkComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentTrayService } from '../../incident-tray.service';
import {
  AvailableTransition,
  TrayIncidentDetail,
  trayErrorMessage,
} from '../../incident-tray.models';

const DATE_FORMAT = 'dd/MM/yyyy HH:mm';
const ACTIVE_STATUSES = ['ABIERTA', 'EN_CURSO'];
const RESULT_PARAM = 'resultado';

/** Destino de navegación por estado de llegada de la transición (pantallas en alcance). */
const TRANSITION_ROUTES: Record<string, string> = {
  EN_CURSO: 'iniciar-atencion',
  RESUELTA: 'resolver',
};

const RESULT_MESSAGES: Record<string, string> = {
  liberada: 'Incidencia liberada',
  iniciada: 'Atención iniciada',
  resuelta: 'Incidencia marcada como resuelta',
  reasignada: 'Incidencia reasignada',
};

/** ARC-029 · Detalle de la incidencia (técnico). Las acciones las decide la API. */
@Component({
  selector: 'app-tray-incident-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bLinkComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
    B2bTagComponent,
  ],
  templateUrl: './tray-incident-detail.page.html',
  styleUrl: './tray-incident-detail.page.scss',
})
export class TrayIncidentDetailPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(IncidentTrayService);
  private destroyRef = inject(DestroyRef);

  readonly dateFormat = DATE_FORMAT;

  readonly id = signal('');
  readonly incident = signal<TrayIncidentDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly confirmingSelfAssign = signal(false);
  readonly assigning = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly actionResult = signal<string | null>(null);

  private readonly queryParams = signal<Params>({});
  private loadSub: Subscription | null = null;

  /** Mensaje de resultado: el de la acción local prevalece sobre el de la URL. */
  readonly resultMessage = computed<string | null>(() => {
    const local = this.actionResult();
    if (local) return local;
    const code = this.queryParams()[RESULT_PARAM];
    return typeof code === 'string' ? RESULT_MESSAGES[code] ?? null : null;
  });

  readonly errorMessage = computed<string | null>(
    () => this.actionError() ?? this.loadError()
  );

  readonly isAssigned = computed(() => this.incident()?.assignmentStatus === 'ASIGNADA');

  private readonly isActive = computed(() =>
    ACTIVE_STATUSES.includes(this.incident()?.status ?? '')
  );

  readonly canSelfAssign = computed(
    () => this.incident()?.assignmentStatus === 'SIN_ASIGNAR' && this.isActive()
  );

  readonly canRelease = computed(() => this.isAssigned() && this.isActive());

  readonly canReassign = computed(
    () => this.isAssigned() && (this.incident()?.status ?? '') !== 'CERRADA'
  );

  /** Solo transiciones con pantalla en el alcance (EN_CURSO, RESUELTA). */
  readonly transitions = computed<AvailableTransition[]>(() =>
    (this.incident()?.availableTransitions ?? []).filter(
      (t) => TRANSITION_ROUTES[t.toStatus] !== undefined
    )
  );

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pm) => {
      this.id.set(pm.get('id') ?? '');
      this.confirmingSelfAssign.set(false);
      this.actionError.set(null);
      this.actionResult.set(null);
      this.load();
    });
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((qp) => this.queryParams.set(qp));
  }

  /** Carga el detalle (EP-028). */
  load(): void {
    const id = this.id();
    this.loadSub?.unsubscribe();
    this.loadError.set(null);
    if (!id) {
      this.incident.set(null);
      this.loading.set(false);
      this.loadError.set('La incidencia solicitada no existe.');
      return;
    }
    this.loading.set(true);
    this.loadSub = this.service
      .detail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.incident.set(detail);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.incident.set(null);
          this.loading.set(false);
          const status = err instanceof HttpErrorResponse ? err.status : 0;
          this.loadError.set(
            status === 404
              ? 'La incidencia solicitada no existe.'
              : trayErrorMessage(err, 'No se ha podido cargar la incidencia')
          );
        },
      });
  }

  /** «Actualizar transiciones»: recarga el detalle. */
  refresh(): void {
    this.actionError.set(null);
    this.load();
  }

  askSelfAssign(): void {
    this.actionError.set(null);
    this.actionResult.set(null);
    this.confirmingSelfAssign.set(true);
  }

  cancelSelfAssign(): void {
    this.confirmingSelfAssign.set(false);
  }

  /** EP-031 tras confirmación explícita. */
  confirmSelfAssign(): void {
    const id = this.id();
    if (!id || this.assigning()) return;
    this.assigning.set(true);
    this.service
      .selfAssign(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assigning.set(false);
          this.confirmingSelfAssign.set(false);
          this.actionError.set(null);
          this.actionResult.set('Te has asignado la incidencia');
          this.load();
        },
        error: (err: unknown) => {
          this.assigning.set(false);
          this.confirmingSelfAssign.set(false);
          this.actionResult.set(null);
          this.actionError.set(
            trayErrorMessage(err, 'No se ha podido completar la asignación')
          );
          this.load();
        },
      });
  }

  release(): void {
    this.router.navigate(['/incidencias', this.id(), 'liberar']);
  }

  reassign(): void {
    this.router.navigate(['/incidencias', this.id(), 'reasignar']);
  }

  startTransition(t: AvailableTransition): void {
    if (t.blockedReason) return;
    const segment = TRANSITION_ROUTES[t.toStatus];
    if (!segment) return;
    this.router.navigate(['/incidencias', this.id(), segment]);
  }

  /** Vuelve a la bandeja conservando filtros y paginación (sin `resultado`). */
  backToTray(): void {
    const queryParams: Params = { ...this.queryParams() };
    delete queryParams[RESULT_PARAM];
    this.router.navigate(['/incidencias'], { queryParams });
  }
}
