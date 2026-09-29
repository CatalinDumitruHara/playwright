import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bCardPrimaryComponent,
  B2bReadDataComponent,
  B2bContainerComponent,
} from '@mapfre-tech/b2b-components';

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
  ],
  templateUrl: './my-profile.page.html',
  styleUrl: './my-profile.page.scss',
})
export class MyProfilePage {
  userName = 'Usuario de prueba';
  userEmail = 'test@example.com';
  userRole = 'Administrador';
  accountStatus = 'Activa';
  lastPasswordUpdate = new Date();
}
