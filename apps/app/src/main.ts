import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { getAppConfig } from './app/app.config';
import { initMultiEnvironmentApp } from '@mapfre-tech/ngx-multienvironment/core';

async function bootstrapApp() {
  console.log('Bootstrapping app...');
  const { env, envConfig } = await initMultiEnvironmentApp();
  bootstrapApplication(AppComponent, getAppConfig({ env, envConfig })).catch(
    (err: any) => console.error(err)
  );
}

bootstrapApp();
