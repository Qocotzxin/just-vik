import { AgGridModule } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { DeleteBtnComponent } from 'src/app/components/ag-grid/delete-btn.component';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { SalesChartComponent } from './sales-chart/sales-chart.component';
import { SalesFormComponent } from './sales-form/sales-form.component';
import { SalesComponent } from './sales.component';

const routes: Route[] = [
  {
    path: '',
    component: SalesComponent,
  },
];
@NgModule({
  declarations: [SalesComponent, SalesFormComponent, SalesChartComponent],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    AgGridModule.withComponents([DeleteBtnComponent]),
    RouterModule.forChild(routes),
    SharedModule,
  ],
  exports: [RouterModule],
})
export class SalesModule {}
