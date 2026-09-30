import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bCardPrimaryComponent,
  B2bReadDataComponent,
  B2bContainerComponent,
  B2bTagComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { SessionDetail } from '@api-types';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    B2bButtonComponent,
    B2bCardPrimaryComponent,
    B2bReadDataComponent,
    B2bContainerComponent,
    B2bTagComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './my-profile.page.html',
  styleUrl: './my-profile.page.scss',
})
export class MyProfilePage implements OnInit {
  private authService = inject(AuthenticationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  session: SessionDetail | null = null;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.session = this.authService.getSession();
    if (!this.session) {
      this.authService.getSessionContext().subscribe({
        next: () => {
          this.session = this.authService.getSession();
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No ha sido posible cargar tus datos';
          this.cdr.markForCheck();
        },
      });
    }
  }

  goToChangePassword(): void {
    this.router.navigate(['/mi-perfil/contrasena']);
  }

  goToHome(): void {
    this.router.navigate(['/inicio']);
  }
}
