// ARC-030 · Confirmación de solicitud de vacaciones registrada — /solicitudes/nueva/confirmacion
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { VacationRequestDetail } from '@api-types';

@Component({
  selector: 'app-vacation-request-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vacation-request-confirmation.page.html',
  styleUrl: './vacation-request-confirmation.page.scss',
})
export class VacationRequestConfirmationPage {
  private router = inject(Router);

  readonly data = signal<VacationRequestDetail | null>(this.readRequest());

  private readRequest(): VacationRequestDetail | null {
    const fromNavigation = this.router.getCurrentNavigation()?.extras?.state?.[
      'request'
    ] as VacationRequestDetail | undefined;
    if (fromNavigation) {
      return fromNavigation;
    }
    const fromHistory =
      typeof history !== 'undefined'
        ? (history.state?.request as VacationRequestDetail | undefined)
        : undefined;
    return fromHistory ?? null;
  }
}
