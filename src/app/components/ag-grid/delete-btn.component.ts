import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'delete-btn',
  template: ` <div
    class="delete-btn"
    matTooltip="Borrar producto"
    (click)="onDelete($event)"
  >
    <mat-icon aria-label="Borrar producto">delete</mat-icon>
  </div>`,
  styles: [
    `
      .delete-btn {
        cursor: pointer;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: end;
      }

      .delete-btn:hover {
        color: #c2185b;
      }
    `,
  ],
})
export class DeleteBtnComponent implements ICellRendererAngularComp, OnDestroy {
  private params: any;
  refresh: any;

  agInit(params: any) {
    this.params = params;
  }

  onDelete(e: any) {
    this.params.clicked(this.params.value);
  }

  ngOnDestroy() {}
}
