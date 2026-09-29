import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-session-ended',
  templateUrl: './session-ended.page.html',
  styleUrls: ['./session-ended.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bContainerComponent,
    B2bNotificationInlineComponent,
    B2bButtonComponent,
  ],
})
export class SessionEndedPage implements OnInit {
  reason: string;
  endedAt: Date;

  constructor(private router: Router) {
    this.reason = '';
    this.endedAt = new Date();
  }

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    this.reason =
      navigation?.extras.state?.['reason'] ||
      'Tu sesión ha finalizado por inactividad.';
    this.endedAt = new Date();
  }

  goToLogin() {
    this.router.navigate(['/acceso']);
  }
}
