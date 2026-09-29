import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
  B2bContainerComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-change-password-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bNotificationInlineComponent,
    B2bContainerComponent,
  ],
  templateUrl: './change-password-confirmation.page.html',
  styleUrl: './change-password-confirmation.page.scss',
})
export class ChangePasswordConfirmationPage {
  changedAt = new Date();
}
