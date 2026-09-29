import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-session-ended',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './session-ended.page.html',
  styleUrl: './session-ended.page.scss',
})
export class SessionEndedPage {
  reason = 'Cierre de sesión voluntario';
  endedAt = new Date();
}
