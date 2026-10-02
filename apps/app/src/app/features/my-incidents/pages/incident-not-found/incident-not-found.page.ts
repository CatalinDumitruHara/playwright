import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-incident-not-found-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bLabelComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './incident-not-found.page.html',
  styleUrl: './incident-not-found.page.scss',
})
export class IncidentNotFoundPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly requestedId: string | null;

  constructor() {
    const id = this.route.snapshot.queryParamMap.get('id');
    this.requestedId = id && id.trim() !== '' ? id.trim() : null;
  }

  backToAll(): void {
    this.router.navigate(['/incidents']);
  }
}
