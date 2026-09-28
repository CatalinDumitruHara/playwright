import { Spectator, createRoutingFactory, mockProvider } from '@ngneat/spectator/jest';
import { UnauthorizedAccessPage } from './unauthorized-access.page';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { Router } from '@angular/router';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

describe('UnauthorizedAccessPage', () => {
  let spectator: Spectator<UnauthorizedAccessPage>;
  const createComponent = createRoutingFactory({
    component: UnauthorizedAccessPage,
    imports: [B2bButtonComponent, B2bNotificationInlineComponent],
    providers: [
      mockProvider(AuthenticationService, {
        sessionContext: () => ({
          user: { name: 'Test User' },
          permissions: ['test-role'],
        }),
      }),
    ],
    // Do not use mocks: [Router] here, as we will provide a custom one.
    detectChanges: false,
  });

  it('should create', () => {
    spectator = createComponent({
      providers: [
        {
          provide: Router,
          useValue: { url: '', navigate: jest.fn(), initialNavigation: jest.fn() },
        },
      ],
    });
    spectator.detectChanges();
    expect(spectator.component).toBeTruthy();
  });

  it('should display the current URL and user role', () => {
    const testUrl = '/test-url';
    spectator = createComponent({
      providers: [
        {
          provide: Router,
          useValue: {
            url: testUrl,
            navigate: jest.fn(),
            initialNavigation: jest.fn(), // Add the missing function
          },
        },
      ],
    });

    spectator.detectChanges();

    const paragraphs = spectator.queryAll('p');
    expect(paragraphs[0]).toHaveText(`Ruta solicitada: ${testUrl}`);
    expect(paragraphs[1]).toHaveText(`Tu rol actual: test-role`);
  });

  it('should navigate to home on "Volver" button click', () => {
    const routerMock = { url: '', navigate: jest.fn(), initialNavigation: jest.fn() };
    spectator = createComponent({
      providers: [{ provide: Router, useValue: routerMock }],
    });
    spectator.detectChanges();

    const backButton = spectator.query('button');
    if (backButton) {
      spectator.click(backButton);
    }

    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });
});
