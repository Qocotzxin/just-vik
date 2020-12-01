import { NgModule } from '@angular/core';
import {
  AngularFireAuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './containers/login/login.component';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: () => redirectLoggedInTo(['products']) },
  },
  {
    path: 'products',
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: () => redirectUnauthorizedTo(['']) },
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./containers/products/products.module').then(
            (m) => m.ProductsModule
          ),
      },
      {
        path: 'add',
        loadChildren: () =>
          import(
            './containers/products/products-form/products-form.module'
          ).then((m) => m.ProductsFormModule),
      },
      {
        path: 'edit/:id',
        loadChildren: () =>
          import(
            './containers/products/products-form/products-form.module'
          ).then((m) => m.ProductsFormModule),
      },
    ],
  },
  {
    path: 'sales',
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: () => redirectUnauthorizedTo(['']) },
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./containers/sales/sales.module').then((m) => m.SalesModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
