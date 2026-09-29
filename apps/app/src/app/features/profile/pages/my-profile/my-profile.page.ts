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
  ],
  templateUrl: './my-profile.page.html',
  styleUrl: './my-profile.page.scss',
})
export class MyProfilePage implements OnInit {
  private authService = inject(AuthenticationService);
  private router = inject(Router);

  session: SessionDetail | null = null;

  ngOnInit(): void {
    this.session = this.authService.getSession();
  }

  goToChangePassword(): void {
    this.router.navigate(['/mi-perfil/contrasena']);
  }

  goToHome(): void {
    this.router.navigate(['/inicio']);
  }
}
