import { RouterModule, Routes } from '@angular/router';
import { LayoutPageComponent } from './creditos/pages/layout-page/layout-page.component';
import { NgModule } from '@angular/core';
import { ListPageComponent } from './creditos/pages/list-page/list-page.component';

export const routes: Routes = [
    {
        path:'home',
        component:LayoutPageComponent
    },
    {
        path:'test',
        component:ListPageComponent
    },
    {
        path:'**',
        redirectTo:'home'
    }
];


