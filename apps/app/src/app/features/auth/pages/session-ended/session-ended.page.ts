import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { B2bButtonComponent, B2bContainerComponent, B2bNotificationInlineComponent } from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-session-ended',
  standalone: true,
  imports: [CommonModule, RouterModule, B2bButtonComponent, B2bContainerComponent, B2bNotificationInlineComponent],
  templateUrl: './session-ended.page.html',
  styleUrl: './session-ended.page.scss',
})
export class SessionEndedPage {
  reason: string;
  date: Date;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    this.reason = navigation?.extras.state?.['reason'] || 'Tu sesión ha finalizado';
    this.date = navigation?.extras.state?.['date'] || new Date();
  }

  goToLogin(): void {
    this.router.navigate(['/acceso']);
  }
}
