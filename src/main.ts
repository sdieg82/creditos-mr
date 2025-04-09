import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    // Añade provideRouter con tus rutas y la feature withHashLocation
    provideRouter(routes, withHashLocation())
    // ... otros providers globales si los tienes (e.g., provideHttpClient())
  ]
})
  .catch(err => console.error(err));