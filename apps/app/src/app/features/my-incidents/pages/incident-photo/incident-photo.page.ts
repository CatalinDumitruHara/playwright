import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
  B2bSpinnerComponent,
} from '@mapfre-tech/b2b-components';
import { MyIncidentsService, photoToBlob } from '../../my-incidents.service';
import { PhotoContent } from '../../my-incidents.models';

@Component({
  selector: 'app-incident-photo-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bReadDataComponent,
    B2bSpinnerComponent,
  ],
  templateUrl: './incident-photo.page.html',
  styleUrl: './incident-photo.page.scss',
})
export class IncidentPhotoPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(MyIncidentsService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  id = '';
  loading = false;
  error = false;
  empty = false;
  photo: PhotoContent | null = null;
  safeUrl: SafeUrl | null = null;
  private objectUrl: string | null = null;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  ngOnDestroy(): void {
    this.revoke();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.empty = false;
    this.service
      .photo(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (photo) => {
          this.loading = false;
          this.revoke();
          if (!photo) {
            this.photo = null;
            this.empty = true;
          } else {
            try {
              this.objectUrl = URL.createObjectURL(photoToBlob(photo));
              this.safeUrl = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
              this.photo = photo;
            } catch {
              this.photo = null;
              this.error = true;
            }
          }
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

  download(): void {
    if (!this.photo || !this.objectUrl || typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = this.objectUrl;
    link.download = this.photo.fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  backToDetail(): void {
    this.router.navigate(['/mis-incidencias', this.id]);
  }

  private revoke(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.safeUrl = null;
  }
}
