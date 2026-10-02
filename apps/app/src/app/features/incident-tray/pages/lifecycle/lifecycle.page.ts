import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentTrayService } from '../../incident-tray.service';
import { TrayIncidentDetail, trayErrorMessage } from '../../incident-tray.models';

export const NOT_REACHED_LABEL = 'Aún no alcanzada';
export const LOAD_ERROR_FALLBACK = 'No se ha podido cargar la información de la incidencia';

/** ARC-035 «Marcas temporales del ciclo de vida» — /incidencias/:id/ciclo-vida (EP-028). */
@Component({
  selector: 'app-lifecycle-page',
  standalone: true,
  imports: [
    CommonModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
    B2bTagComponent,
  ],
  templateUrl: './lifecycle.page.html',
  styleUrl: './lifecycle.page.scss',
})
export class LifecyclePage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(IncidentTrayService);
  private destroyRef = inject(DestroyRef);

  readonly notReached = NOT_REACHED_LABEL;

  readonly id = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly detail = signal<TrayIncidentDetail | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.id.set(params.get('id') ?? '');
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.detail.set(null);
    this.service
      .detail(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.detail.set(d);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(trayErrorMessage(err, LOAD_ERROR_FALLBACK));
        },
      });
  }

  /** Días en el estado actual tal como los envía el backend; no se calculan en la SPA. */
  daysLabel(d: TrayIncidentDetail): string {
    return d.daysInCurrentStatus === null ? '—' : String(d.daysInCurrentStatus);
  }

  backToDetail(): void {
    this.router.navigate(['/incidencias', this.id()]);
  }
}
