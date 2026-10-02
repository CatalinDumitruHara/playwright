import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bLinkComponent,
  B2bListBasicComponent,
  B2bListComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { MyIncidentsService, photoToBlob } from '../../my-incidents.service';
import {
  HistoryEntry,
  IncidentView,
  PhotoContent,
  statusLabel,
} from '../../my-incidents.models';

const DATE_FORMAT = 'dd/MM/yyyy HH:mm';

/** ARC-026 · Detalle de la incidencia (mis incidencias). Solo lectura (REQ-160). */
@Component({
  selector: 'app-incident-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bLinkComponent,
    B2bListComponent,
    B2bListBasicComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
    B2bTagComponent,
  ],
  providers: [DatePipe],
  templateUrl: './incident-detail.page.html',
  styleUrl: './incident-detail.page.scss',
})
export class IncidentDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private service = inject(MyIncidentsService);
  private datePipe = inject(DatePipe);
  private cdr = inject(ChangeDetectorRef);

  readonly dateFormat = DATE_FORMAT;

  id = '';
  incident: IncidentView | null = null;
  loading = false;
  loadError = false;

  history: HistoryEntry[] = [];
  historyLoading = false;
  historyError = false;

  downloading = false;
  photoUnavailable = false;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  get statusText(): string {
    return statusLabel(this.incident?.statusCode);
  }

  get isClosed(): boolean {
    return this.incident?.statusCode === 'CERRADA';
  }

  /** Carga el detalle (EP-028) y el historial (EP-029). */
  load(): void {
    if (!this.id) {
      this.goNotFound();
      return;
    }
    this.loading = true;
    this.loadError = false;
    this.incident = null;
    this.photoUnavailable = false;
    this.service.detail(this.id).subscribe({
      next: (incident) => {
        this.incident = incident;
        this.loading = false;
        this.cdr.markForCheck();
        this.loadHistory();
      },
      error: (err: unknown) => {
        this.loading = false;
        const status = err instanceof HttpErrorResponse ? err.status : 0;
        if (status === 404 || status === 403) {
          this.goNotFound();
        } else {
          this.loadError = true;
        }
        this.cdr.markForCheck();
      },
    });
  }

  /** Descarga la foto adjunta (EP-030). */
  downloadPhoto(): void {
    if (!this.incident?.photoId || this.downloading) return;
    this.downloading = true;
    this.photoUnavailable = false;
    this.service.photo(this.id).subscribe({
      next: (photo) => {
        this.downloading = false;
        if (photo) {
          this.triggerDownload(photo);
        } else {
          this.photoUnavailable = true;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.downloading = false;
        this.photoUnavailable = true;
        this.cdr.markForCheck();
      },
    });
  }

  /** Vuelve al listado conservando filtros si hay historial de navegación. */
  back(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/mis-incidencias']);
    }
  }

  historyTitle(entry: HistoryEntry): string {
    const from = entry.fromStatus ? statusLabel(entry.fromStatus) : 'Alta';
    const parts = [`${from} → ${statusLabel(entry.toStatus)}`];
    if (entry.actorName) parts.push(entry.actorName);
    const when = this.formatDate(entry.changedAt);
    if (when) parts.push(when);
    if (entry.comment) parts.push(entry.comment);
    return parts.join(' · ');
  }

  private loadHistory(): void {
    this.historyLoading = true;
    this.historyError = false;
    this.service.history(this.id).subscribe({
      next: (entries) => {
        this.history = entries;
        this.historyLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.history = [];
        this.historyLoading = false;
        this.historyError = true;
        this.cdr.markForCheck();
      },
    });
  }

  private triggerDownload(photo: PhotoContent): void {
    const url = URL.createObjectURL(photoToBlob(photo));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = photo.fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private formatDate(value: string | null): string {
    if (!value) return '';
    try {
      return this.datePipe.transform(value, DATE_FORMAT) ?? '';
    } catch {
      return value;
    }
  }

  private goNotFound(): void {
    this.router.navigate(['/incidencias/no-encontrada'], {
      queryParams: { id: this.id },
    });
  }
}
