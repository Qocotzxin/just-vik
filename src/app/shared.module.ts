import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LapseSelectorComponent } from './components/time-lapse-selector/time-lapse-selector.component';
import { MaterialModule } from './material.module';

@NgModule({
  imports: [CommonModule, MaterialModule],
  declarations: [LapseSelectorComponent],
  exports: [LapseSelectorComponent],
})
export class SharedModule {}
