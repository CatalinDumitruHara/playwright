import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  B2bContainerComponent,
  B2bHeaderDesktopComponent,
  B2bIconComponent,
  B2bMapfreLogoComponent,
  B2bSidebarComponent,
  B2bSidebarItemComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    B2bHeaderDesktopComponent,
    B2bSidebarComponent,
    B2bSidebarItemComponent,
    B2bContainerComponent,
    B2bMapfreLogoComponent,
    B2bIconComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
