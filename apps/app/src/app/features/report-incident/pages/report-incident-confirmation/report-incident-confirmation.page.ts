import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bLinkComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { CreatedIncident } from '../../report-incident.models';

const STATUS_LABELS: Record<string, string> = {
  ABIERTA: 'Abierta',
};

/** Etiqueta legible de un código de estado (ABIERTA → Abierta, EN_CURSO → En curso). */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return '';
  const code = status.trim().toUpperCase();
  if (STATUS_LABELS[code]) return STATUS_LABELS[code];
  const text = code.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function isCreatedIncident(value: unknown): value is CreatedIncident {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['incidentId'] === 'string' && v['incidentId'] !== '';
}

@Component({
  selector: 'app-report-incident-confirmation-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bLinkComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bTagComponent,
  ],
  templateUrl: './report-incident-confirmation.page.html',
  styleUrl: './report-incident-confirmation.page.scss',
})
export class ReportIncidentConfirmationPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  incidentId: string | null = null;
  referenceCode: string | null = null;
  status: string | null = null;
  createdAt: Date | null = null;
  photoStored = true;
  copied = false;

  constructor() {
    const navState = this.router.getCurrentNavigation()?.extras.state;
    const historyState: unknown =
      typeof history !== 'undefined' ? history.state : null;
    const candidate =
      (navState as Record<string, unknown> | undefined)?.['created'] ??
      (historyState && typeof historyState === 'object'
        ? (historyState as Record<string, unknown>)['created']
        : undefined);

    if (isCreatedIncident(candidate)) {
      this.incidentId = candidate.incidentId;
      this.referenceCode = candidate.referenceCode || null;
      this.status = candidate.status || null;
      this.createdAt = this.parseDate(candidate.createdAt);
      this.photoStored = candidate.photoStored !== false;
    } else {
      const params = this.route.snapshot.queryParamMap;
      const id = params.get('id');
      const ref = params.get('ref');
      this.incidentId = id && id.trim() !== '' ? id : null;
      this.referenceCode = this.incidentId && ref && ref.trim() !== '' ? ref : null;
    }
  }

  get hasIncident(): boolean {
    return this.incidentId !== null;
  }

  get statusText(): string {
    return statusLabel(this.status);
  }

  copyCode(): void {
    const code = this.referenceCode;
    const clipboard =
      typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (!code || !clipboard?.writeText) return;
    clipboard
      .writeText(code)
      .then(() => {
        this.copied = true;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.copied = false;
        this.cdr.markForCheck();
      });
  }

  registerAnother(): void {
    this.router.navigate(['/incidencias/nueva']);
  }

  private parseDate(value: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
