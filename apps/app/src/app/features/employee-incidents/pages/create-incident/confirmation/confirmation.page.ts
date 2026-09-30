import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { B2bButtonComponent } from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-confirmation-page',
  standalone: true,
  imports: [RouterModule, B2bButtonComponent],
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
})
export class ConfirmationPage {}
