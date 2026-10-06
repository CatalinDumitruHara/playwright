import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  B2bButtonComponent,
  B2bCardPrimaryComponent,
  B2bContainerComponent,
  B2bLinkComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { IncidentTrayService } from '../../incident-tray.service';
import { SimilarClosure } from '../../incident-tray.models';
import { IncidentView, statusLabel } from '../../../my-incidents/my-incidents.models';

export const SIMILAR_PAGE_SIZE = 10;
export const COMMENT_PREVIEW_LENGTH = 200;
export const MSG_FORBIDDEN = 'No tiene permisos para realizar esta operación';
export const MSG_SIMILAR_FAILED = 'No se han podido cargar los cierres anteriores';
export const MSG_SIMILAR_EMPTY = 'Sin cierres anteriores para esta sala y categoría';

/** ARC-036 · Cierres anteriores en esta sala y categoría (EP-028 + EP-037). */
@Component({
  selector: 'app-similar-closures-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    B2bButtonComponent,
    B2bCardPrimaryComponent,
    B2bContainerComponent,
    B2bLinkComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
    B2bTagComponent,
  ],
  templateUrl: './similar-closures.page.html',
  styleUrl: './similar-closures.page.scss',
})
export class SimilarClosuresPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private service = inject(IncidentTrayService);
  private cdr = inject(ChangeDetectorRef);

  readonly msgEmpty = MSG_SIMILAR_EMPTY;

  id = '';
  incident: IncidentView | null = null;
  loadingDetail = false;

  closures: SimilarClosure[] = [];
  page = 0;
  hasMore = false;
  loadingClosures = false;
  closuresLoaded = false;
  closuresError: string | null = null;
  closuresRetryable = false;

  /** Índices de tarjetas con el comentario completo desplegado. */
  private expanded = new Set<number>();

  get loading(): boolean {
    return this.loadingDetail || this.loadingClosures;
  }

  get isResolved(): boolean {
    return (this.incident?.statusCode ?? '').toUpperCase() === 'RESUELTA';
  }

  get currentStatusLabel(): string {
    return statusLabel(this.incident?.statusCode);
  }

  get isEmpty(): boolean {
    return this.closuresLoaded && !this.closuresError && this.closures.length === 0;
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadDetail();
    this.loadClosures(1);
  }

  loadDetail(): void {
    this.loadingDetail = true;
    this.service.detail(this.id).subscribe({
      next: (incident) => {
        this.incident = incident;
        this.loadingDetail = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.loadingDetail = false;
        const status = err instanceof HttpErrorResponse ? err.status : 0;
        if (status === 403 || status === 404) {
          this.router.navigate(['/incidencias/no-encontrada'], {
            queryParams: { id: this.id },
          });
        }
        this.cdr.markForCheck();
      },
    });
  }

  loadClosures(page: number): void {
    if (this.loadingClosures) return;
    this.loadingClosures = true;
    this.closuresError = null;
    this.closuresRetryable = false;
    this.service.similarClosures(this.id, page, SIMILAR_PAGE_SIZE).subscribe({
      next: (view) => {
        this.closures = page === 1 ? view.items : [...this.closures, ...view.items];
        if (page === 1) this.expanded.clear();
        this.page = view.page;
        this.hasMore = view.hasMore;
        this.loadingClosures = false;
        this.closuresLoaded = true;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.loadingClosures = false;
        const status = err instanceof HttpErrorResponse ? err.status : 0;
        if (status === 403) {
          this.closuresError = MSG_FORBIDDEN;
        } else {
          this.closuresError = MSG_SIMILAR_FAILED;
          this.closuresRetryable = true;
        }
        this.cdr.markForCheck();
      },
    });
  }

  retry(): void {
    this.loadClosures(this.closuresLoaded ? this.page + 1 : 1);
  }

  loadMore(): void {
    this.loadClosures(this.page + 1);
  }

  isTruncatable(c: SimilarClosure): boolean {
    return c.resolutionComment.length > COMMENT_PREVIEW_LENGTH;
  }

  isExpanded(index: number): boolean {
    return this.expanded.has(index);
  }

  toggleComment(index: number): void {
    if (this.expanded.has(index)) {
      this.expanded.delete(index);
    } else {
      this.expanded.add(index);
    }
  }

  commentText(c: SimilarClosure, index: number): string {
    if (!this.isTruncatable(c) || this.isExpanded(index)) {
      return c.resolutionComment;
    }
    return c.resolutionComment.slice(0, COMMENT_PREVIEW_LENGTH) + '…';
  }

  closeIncident(): void {
    this.router.navigate(['/incidencias', this.id, 'cerrar']);
  }

  reuse(c: SimilarClosure): void {
    this.router.navigate(['/incidencias', this.id, 'cerrar'], {
      queryParams: { comentario: c.resolutionComment },
    });
  }

  back(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/mis-incidencias', this.id]);
    }
  }
}
