import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  B2bLinkComponent,
  B2bListComponent,
  B2bNotificationInlineComponent,
  B2bReadDataComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import {
  NAV_ITEMS,
  NavItem,
  navItemsForRole,
} from '../../../../core/navigation/navigation.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterLink,
    B2bReadDataComponent,
    B2bListComponent,
    B2bLinkComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly auth = inject(AuthenticationService);
  private readonly navItems = inject(NAV_ITEMS);

  readonly user = this.auth.currentUser;
  readonly shortcuts = computed<NavItem[]>(() =>
    navItemsForRole(this.navItems, this.user()?.roleCode).filter(
      (item) => item.shortcut
    )
  );
}
