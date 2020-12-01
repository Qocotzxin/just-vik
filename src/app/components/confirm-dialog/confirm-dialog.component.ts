import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Product } from 'src/app/model/product';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 mat-dialog-title>Confirmar</h1>
    <div mat-dialog-content>
      <p>Desea eliminar el siguiente producto? {{ data.name }}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close cdkFocusInitial>No</button>
      <button mat-button [mat-dialog-close]="true">Si</button>
    </div>`,
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Product) {}
}
