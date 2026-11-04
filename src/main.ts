import {bootstrapApplication} from '@angular/platform-browser';
import {provideRouter,withHashLocation,withRouterConfig,withInMemoryScrolling} from '@angular/router';
import {AppComponent} from './app/app.component';
import {routes} from './app/app.routes';
bootstrapApplication(AppComponent,{providers:[provideRouter(routes,withHashLocation(),withRouterConfig({onSameUrlNavigation:'reload'}),withInMemoryScrolling({scrollPositionRestoration:'top'}))]}).catch(error=>console.error(error));
