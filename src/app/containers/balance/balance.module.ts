import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { BalanceComponent } from './balance.component';

const routes: Route[] = [
  {
    path: '',
    component: BalanceComponent,
  },
];
@NgModule({
  declarations: [BalanceComponent],
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule.forChild(routes),
    SharedModule,
  ],
  exports: [RouterModule],
})
export class BalanceModule {}
