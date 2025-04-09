import { RouterModule, Routes } from '@angular/router';
import { LayoutPageComponent } from './creditos/pages/layout-page/layout-page.component';
import { NgModule } from '@angular/core';

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


