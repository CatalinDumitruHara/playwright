import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bCardPrimaryComponent,
  B2bReadDataComponent,
  B2bContainerComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService, SessionContext } from '../../../../core/auth/authentication.service';

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
  ],
  templateUrl: './my-profile.page.html',
  styleUrl: './my-profile.page.scss',
})
export class MyProfilePage implements OnInit {
  private authService = inject(AuthenticationService);
  private router = inject(Router);

  user_data: SessionContext['user'] | undefined;
  // TODO: remove mock
  account_status = 'Activa';
  last_password_change = new Date();

  ngOnInit(): void {
    this.authService.getSessionContext().subscribe(session => {
      this.user_data = session?.user;
    });
  }

  goToChangePassword(): void {
    this.router.navigate(['/mi-perfil/contrasena']);
  }

  goToHome(): void {
    this.router.navigate(['/inicio']);
  }
}
