import { Routes } from '@angular/router';
import { LayoutPageComponent } from './creditos/pages/layout-page/layout-page.component';

export const routes: Routes = [
    {
        path:'home',
        component:LayoutPageComponent
    },
    {
        path:'**',
        redirectTo:'home'
    }
];
