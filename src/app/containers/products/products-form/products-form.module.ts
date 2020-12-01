import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { ProductsFormComponent } from './products-form.component';
const routes: Routes = [
  {
    path: '',
    component: ProductsFormComponent,
  },
];
@NgModule({
  declarations: [ProductsFormComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MaterialModule,
    ReactiveFormsModule,
  ],
  exports: [RouterModule, ProductsFormComponent],
})
export class ProductsFormModule {}
