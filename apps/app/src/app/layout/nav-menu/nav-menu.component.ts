import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  B2bSidebarComponent,
  B2bSidebarItemComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../core/auth/authentication.service';
import {
  NAV_ITEMS,
  NAV_SECTION_AUTH,
  NavItem,
  navItemsForRole,
} from '../../core/navigation/navigation.model';

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [B2bSidebarComponent, B2bSidebarItemComponent],
  templateUrl: './nav-menu.component.html',
  styleUrl: './nav-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'navigation', 'aria-label': 'Menú principal' },
})
export class NavMenuComponent {
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly items = inject(NAV_ITEMS);

  private readonly menu = computed(() =>
    navItemsForRole(this.items, this.auth.currentUser()?.roleCode)
  );

  /** Ítems del menú principal (sin sección 'Auth'); se pintan primero. */
  readonly mainItems = computed(() =>
    this.menu().filter((item) => item.section !== NAV_SECTION_AUTH)
  );

  /** Ítems de la sección 'Auth'; se pintan a continuación. */
  readonly authItems = computed(() =>
    this.menu().filter((item) => item.section === NAV_SECTION_AUTH)
  );

  /** Estado de apertura del sidebar; el output de la librería marca la vista OnPush. */
  readonly expanded = signal(true);

  readonly currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => this.currentUrl.set(e.urlAfterRedirects));
  }

  isActive(item: NavItem): boolean {
    return this.currentUrl().split('?')[0].split('#')[0] === item.path;
  }

  go(item: NavItem): void {
    void this.router.navigateByUrl(item.path);
  }
}
