import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription, forkJoin, of, switchMap } from 'rxjs';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bDropDownSelectComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
  B2bTextAreaComponent,
} from '@mapfre-tech/b2b-components';
import { ReportIncidentService } from '../../report-incident.service';
import {
  CategoryOption,
  CreatedIncident,
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  PHOTO_MAX_BYTES,
  PHOTO_MIME,
  PhotoPayload,
  RoomOption,
} from '../../report-incident.models';

export const MSG_ROOM_REQUIRED = 'Debes indicar la sala afectada';
export const MSG_CATEGORY_REQUIRED = 'Selecciona una categoría';
export const MSG_DESCRIPTION_REQUIRED = 'Describe brevemente la incidencia';
export const MSG_DESCRIPTION_LENGTH = `La descripción debe tener entre ${DESCRIPTION_MIN} y ${DESCRIPTION_MAX} caracteres`;
export const MSG_PHOTO_FORMAT = 'Formato de imagen no admitido, usa JPG o PNG';
export const MSG_PHOTO_SIZE = 'La foto supera el tamaño máximo permitido (5 MB)';
export const MSG_CATALOG_ERROR = 'No se han podido cargar las salas, reintenta';
export const MSG_BAD_REQUEST = 'Revisa los datos del formulario';
export const MSG_ROOM_UNAVAILABLE = 'La sala seleccionada ya no está disponible';
export const MSG_GENERIC = 'No hemos podido registrar la incidencia, inténtalo de nuevo';

/** Validador espejo de la descripción: no vacía tras trim y longitud tras trim en [MIN, MAX]. */
export const descriptionValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const raw = typeof control.value === 'string' ? control.value : '';
  const trimmed = raw.trim();
  if (trimmed === '') return { blank: true };
  if (trimmed.length < DESCRIPTION_MIN || trimmed.length > DESCRIPTION_MAX) {
    return { length: true };
  }
  return null;
};

export interface RoomSelectOption {
  id: number;
  label: string;
}

export interface CategorySelectOption {
  code: string;
  label: string;
}

@Component({
  selector: 'app-report-incident-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bDropDownSelectComponent,
    B2bLabelComponent,
    B2bNotificationInlineComponent,
    B2bTextAreaComponent,
  ],
  templateUrl: './report-incident.page.html',
  styleUrl: './report-incident.page.scss',
})
export class ReportIncidentPage implements OnInit, OnDestroy {
  private service = inject(ReportIncidentService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly descriptionMax = DESCRIPTION_MAX;
  readonly photoAccept = PHOTO_MIME.join(',');

  readonly form = new FormGroup({
    roomId: new FormControl<number | null>(null, Validators.required),
    categoryCode: new FormControl<string | null>(null, Validators.required),
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, descriptionValidator],
    }),
  });

  rooms: RoomOption[] = [];
  categories: CategoryOption[] = [];
  roomOptions: RoomSelectOption[] = [];
  categoryOptions: CategorySelectOption[] = [];

  loadingCatalogs = false;
  catalogError = false;
  submitting = false;
  submitAttempted = false;
  formError: string | null = null;

  photoFile: File | null = null;
  photoPreviewUrl: string | null = null;
  photoError: string | null = null;

  private catalogSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadCatalogs();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  get descriptionLength(): number {
    return this.form.controls.description.value.length;
  }

  get submitDisabled(): boolean {
    return this.submitting || this.catalogError || this.loadingCatalogs;
  }

  get roomError(): string | null {
    const c = this.form.controls.roomId;
    return this.showErrors(c) && c.hasError('required') ? MSG_ROOM_REQUIRED : null;
  }

  get categoryError(): string | null {
    const c = this.form.controls.categoryCode;
    return this.showErrors(c) && c.hasError('required') ? MSG_CATEGORY_REQUIRED : null;
  }

  get descriptionError(): string | null {
    const c = this.form.controls.description;
    if (!this.showErrors(c)) return null;
    if (c.hasError('required') || c.hasError('blank')) return MSG_DESCRIPTION_REQUIRED;
    if (c.hasError('length')) return MSG_DESCRIPTION_LENGTH;
    return null;
  }

  retryCatalogs(): void {
    this.loadCatalogs();
  }

  onPhotoInputChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files.length > 0 ? input.files[0] : null;
    this.onFileSelected(file);
    if (input) input.value = '';
  }

  onFileSelected(file: File | null): void {
    if (!file) return;
    if (!(PHOTO_MIME as ReadonlyArray<string>).includes(file.type)) {
      this.photoError = MSG_PHOTO_FORMAT;
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      this.photoError = MSG_PHOTO_SIZE;
      return;
    }
    this.photoError = null;
    this.revokePreview();
    this.photoFile = file;
    this.photoPreviewUrl = URL.createObjectURL(file);
  }

  removePhoto(): void {
    this.revokePreview();
    this.photoFile = null;
    this.photoError = null;
  }

  submit(): void {
    if (this.submitDisabled) return;
    this.submitAttempted = true;
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { roomId, categoryCode, description } = this.form.getRawValue();
    if (roomId === null || categoryCode === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const photo$: Observable<PhotoPayload | null> = this.photoFile
      ? this.service.readPhoto(this.photoFile)
      : of(null);

    photo$
      .pipe(
        switchMap((photo) =>
          this.service.create({ roomId, categoryCode, description, photo })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (created: CreatedIncident) => {
          this.service.setLastRoomId(roomId);
          this.router.navigate(['/incidencias/nueva/confirmacion'], {
            state: { created },
          });
        },
        error: (err: unknown) => {
          this.formError = this.errorMessage(err);
          this.submitting = false;
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/mis-incidencias']);
  }

  private loadCatalogs(): void {
    this.catalogSub?.unsubscribe();
    this.loadingCatalogs = true;
    this.catalogError = false;

    this.catalogSub = forkJoin({
      categories: this.service.loadCategories(),
      rooms: this.service.loadRooms(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, rooms }) => {
          this.categories = categories.filter((c) => c.active);
          this.rooms = rooms.filter((r) => r.active);
          this.categoryOptions = this.categories.map((c) => ({
            code: c.code,
            label: c.name,
          }));
          this.roomOptions = this.rooms.map((r) => ({
            id: r.id,
            label: r.officeName ? `${r.name} · ${r.officeName}` : r.name,
          }));
          this.applySuggestedRoom();
          this.loadingCatalogs = false;
        },
        error: () => {
          this.catalogError = true;
          this.loadingCatalogs = false;
        },
      });
  }

  private applySuggestedRoom(): void {
    const control = this.form.controls.roomId;
    if (control.value !== null) return;
    const lastId = this.service.getLastRoomId();
    if (lastId !== null && this.rooms.some((r) => r.id === lastId)) {
      control.setValue(lastId);
    }
  }

  private showErrors(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitAttempted);
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const bodyMessage = this.bodyMessage(err);
      if (err.status === 400) return bodyMessage ?? MSG_BAD_REQUEST;
      if (err.status === 422) return bodyMessage ?? MSG_ROOM_UNAVAILABLE;
    }
    return MSG_GENERIC;
  }

  private bodyMessage(err: HttpErrorResponse): string | null {
    const body: unknown = err.error;
    if (typeof body === 'object' && body !== null) {
      const message = (body as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim() !== '') return message;
    }
    return null;
  }

  private revokePreview(): void {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
      this.photoPreviewUrl = null;
    }
  }
}
