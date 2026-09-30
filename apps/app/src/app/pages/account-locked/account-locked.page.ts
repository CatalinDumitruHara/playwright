import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
  B2bContainerComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-account-locked',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bNotificationInlineComponent,
    B2bContainerComponent,
  ],
  templateUrl: './account-locked.page.html',
  styleUrl: './account-locked.page.scss',
})
export class AccountLockedPage {}
