import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  EnvironmentConfig,
  provideEnvironment,
} from '@mapfre-tech/ngx-multienvironment/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';

export const getAppConfig: (config: {
  env: string;
  envConfig: EnvironmentConfig;
}) => ApplicationConfig = config => ({
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideEnvironment(config.env, config.envConfig),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});
