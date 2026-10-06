import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { IncidentView, statusLabel } from '../../../my-incidents/my-incidents.models';

const DATE_FORMAT = 'dd/MM/yyyy HH:mm';

/** ARC-038 · Bloque de resolución de la incidencia. Solo lectura. */
@Component({
  selector: 'app-incident-resolution-page',
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
  templateUrl: './incident-resolution.page.html',
  styleUrl: './incident-resolution.page.scss',
})
export class IncidentResolutionPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private service = inject(IncidentTrayService);
  private cdr = inject(ChangeDetectorRef);

  readonly dateFormat = DATE_FORMAT;

  id = '';
  incident: IncidentView | null = null;
  loading = false;
  loadError = false;
  justClosed = false;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    const state: unknown = typeof history !== 'undefined' ? history.state : null;
    this.justClosed =
      typeof state === 'object' &&
      state !== null &&
      (state as Record<string, unknown>)['closed'] === true;
    this.load();
  }

  get statusText(): string {
    return statusLabel(this.incident?.statusCode);
  }

  get isClosed(): boolean {
    return (this.incident?.statusCode ?? '').toUpperCase() === 'CERRADA';
  }

  load(): void {
    if (!this.id) {
      this.goNotFound();
      return;
    }
    this.loading = true;
    this.loadError = false;
    this.incident = null;
    this.service.detail(this.id).subscribe({
      next: (incident) => {
        this.incident = incident;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.loading = false;
        const status = err instanceof HttpErrorResponse ? err.status : 0;
        if (status === 403 || status === 404) {
          this.goNotFound();
        } else {
          this.loadError = true;
        }
        this.cdr.markForCheck();
      },
    });
  }

  copyComment(): void {
    const text = this.incident?.resolutionComment;
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => undefined);
  }

  back(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/mis-incidencias', this.id]);
    }
  }

  private goNotFound(): void {
    this.router.navigate(['/incidencias/no-encontrada'], {
      queryParams: { id: this.id },
    });
  }
}
