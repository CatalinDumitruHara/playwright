import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { B2bButtonComponent, B2bNotificationInlineComponent } from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterModule, B2bButtonComponent, B2bNotificationInlineComponent],
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.scss'],
})
export class NotFoundPage {}
