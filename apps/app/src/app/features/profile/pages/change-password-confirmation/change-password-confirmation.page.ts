
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-change-password-confirmation',
  templateUrl: './change-password-confirmation.page.html',
  styleUrls: ['./change-password-confirmation.page.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule],
})
export class ChangePasswordConfirmationPage {
  changeDateTime: Date = new Date();
}
