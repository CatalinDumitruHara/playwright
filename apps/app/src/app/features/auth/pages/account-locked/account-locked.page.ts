
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-account-locked',
  templateUrl: './account-locked.page.html',
  styleUrls: ['./account-locked.page.scss'],
  standalone: true,
  imports: [RouterModule, FormsModule],
})
export class AccountLockedPage {
  // TODO: Implement logic to get remaining lock time
  // and handle form submission after lock expires.
  public remainingTime = '15:00'; // Placeholder
  public corporateEmail = 'user@example.com'; // Placeholder
  public password = ''; // Placeholder
  public isFormDisabled = true; // Form is disabled until lock expires
}
