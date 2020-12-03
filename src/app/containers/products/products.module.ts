import { AgGridModule } from '@ag-grid-community/angular';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { DeleteBtnComponent } from 'src/app/components/ag-grid/delete-btn.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { MaterialModule } from 'src/app/material.module';
import { ProductsComponent } from './products.component';

const routes: Route[] = [
  {
    path: '',
    component: ProductsComponent,
  },
];
@NgModule({
  declarations: [ProductsComponent, DeleteBtnComponent, ConfirmDialogComponent],
  imports: [
    CommonModule,
    MaterialModule,
    AgGridModule.withComponents([DeleteBtnComponent]),
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule],
})
export class ProductsModule {}
