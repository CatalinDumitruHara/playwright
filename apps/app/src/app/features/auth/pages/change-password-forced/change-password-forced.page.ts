import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  B2bButtonComponent,
  B2bInputComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-change-password-forced',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bInputComponent,
    B2bButtonComponent,
    B2bLabelComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './change-password-forced.page.html',
  styleUrl: './change-password-forced.page.scss',
})
export class ChangePasswordForcedPage {}
