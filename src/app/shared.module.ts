import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ChartTypeSelectorComponent } from './components/chart-type-selector/chart-type-selector.component';
import { LapseSelectorComponent } from './components/time-lapse-selector/time-lapse-selector.component';
import { MaterialModule } from './material.module';

@NgModule({
  imports: [CommonModule, MaterialModule],
  declarations: [LapseSelectorComponent, ChartTypeSelectorComponent],
  exports: [LapseSelectorComponent, ChartTypeSelectorComponent],
})
export class SharedModule {}
