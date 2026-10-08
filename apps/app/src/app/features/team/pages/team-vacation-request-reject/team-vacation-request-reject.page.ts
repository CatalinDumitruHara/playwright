// ARC-037 · Rechazo de solicitud del equipo (manager) · EP-020
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RejectionRequest } from '@api-types';
import { TeamApiService } from '../../../../core/api/team-api.service';

export const REJECTION_REASON_MAX_LENGTH = 1000;

@Component({
  selector: 'app-team-vacation-request-reject',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './team-vacation-request-reject.page.html',
  styleUrl: './team-vacation-request-reject.page.scss',
})
export class TeamVacationRequestRejectPage implements OnInit {
  private fb = inject(FormBuilder);
  private teamApi = inject(TeamApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly maxLength = REJECTION_REASON_MAX_LENGTH;
  readonly requestId = signal<string>('');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly rejectForm = this.fb.nonNullable.group({
    rejection_reason: ['', [Validators.maxLength(REJECTION_REASON_MAX_LENGTH)]],
  });

  ngOnInit(): void {
    this.requestId.set(this.route.snapshot.paramMap.get('id') ?? '');
  }

  get showMaxLengthError(): boolean {
    const control = this.rejectForm.controls.rejection_reason;
    return !!control.errors?.['maxlength'] && (control.touched || control.dirty);
  }

  onSubmit(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    const id = this.requestId();
    if (!id || this.submitting()) {
      return;
    }

    const reason = this.rejectForm.controls.rejection_reason.value.trim();
    const body: RejectionRequest = reason ? { rejection_reason: reason } : {};

    this.submitting.set(true);
    this.error.set(null);
    this.teamApi.reject(id, body).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/equipo/solicitudes', id]);
      },
      error: () => {
        this.error.set(
          'No ha sido posible rechazar la solicitud, inténtalo de nuevo'
        );
        this.submitting.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/equipo/solicitudes', this.requestId()]);
  }
}
