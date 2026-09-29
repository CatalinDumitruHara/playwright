import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-expired-credential',
  standalone: true,
  imports: [
    CommonModule,
    B2bButtonComponent,
    B2bNotificationInlineComponent,
    RouterModule,
  ],
  templateUrl: './expired-credential.page.html',
  styleUrl: './expired-credential.page.scss',
})
export class ExpiredCredentialPage {}
