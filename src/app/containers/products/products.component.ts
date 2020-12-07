import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ColDef, RowClickedEvent } from 'ag-grid-community';
import firebase from 'firebase/app';
import { Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { DeleteBtnComponent } from 'src/app/components/ag-grid/delete-btn.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { Product } from 'src/app/model/product';
import { CollectionsService } from 'src/app/services/collections.service';
import { productsCols } from 'src/app/utils/ag-grid-config';
import { dateFnsFormat } from 'src/app/utils/dates';
import { ACTION_TEXT } from 'src/app/utils/messages';
import { AG_GRID_LOCALE_ES } from '../../utils/ag-grid-locale';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'products',
  templateUrl: 'products.component.html',
})
export class ProductsComponent implements OnInit, OnDestroy {
  private _unsubscribe$ = new Subject<void>();
  private _deleteItemId = '';

  /**
   * List of products to display in table.
   */
  product$!: Observable<Product[]>;

  /**
   * Flag to hide/show loading state.
   */
  loading = true;

  /**
   * Locale for Ag Grid.
   */
  localeText = AG_GRID_LOCALE_ES;

  /**
   * Custom components to render in ad-grid table.
   */
  frameworkComponents = {
    deleteBtnComponent: DeleteBtnComponent,
  };

  /**
   * Columns definitions.
   */
  columnDefs: ColDef[] = productsCols(
    (field: string) => (this._deleteItemId = field)
  );

  constructor(
    private _collections: CollectionsService,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private _cd: ChangeDetectorRef,
    public router: Router
  ) {}

  ngOnInit() {
    this.product$ = this._collections.user.pipe(
      switchMap((user) => {
        return this._collections
          .productsCollectionChanges(user)
          .pipe(map(this._mapProductsData));
      })
    );
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  /**
   * Takes action when the user clicks any table cell.
   * It either, opens removal dialog, or routes the user
   * to product edition page.
   * @param e: RowClickedEvent
   * @param products: Product[]
   */
  onCellClicked(e: RowClickedEvent, products: Product[]) {
    if (this._deleteItemId) {
      const id = this._deleteItemId;
      this._deleteItemId = '';
      return this._openConfirmationDialog(
        id,
        products.find((p) => p.id === id)
      );
    }
    this.router.navigate(['products', 'edit', products[e.rowIndex].id], {
      state: { data: products[e.rowIndex] },
    });
  }

  /**
   * Modifies products dates to display correctly in table
   * @param data: Product[] | null
   * @private
   * @property
   */
  private _mapProductsData = (data: Product[] | null): Product[] => {
    this.loading = false;
    this._cd.detectChanges();
    return (
      (data &&
        data.map((p) => ({
          ...p,
          lastModification: dateFnsFormat(
            (p.lastModification as firebase.firestore.Timestamp).toDate()
          ),
        }))) ||
      []
    );
  };

  /**
   * Returns an observable with an error message, or void
   * if delete process was successfull.
   * @private
   * @method
   * @param id: string
   * @returns Observable<string | void>
   */
  private _onDelete(id: string): Observable<string | void> {
    return this._collections.user.pipe(
      switchMap((user) => this._collections.productDoc(user, id).delete()),
      takeUntil(this._unsubscribe$),
      catchError(() => of('No se pudo borrar el producto.'))
    );
  }

  /**
   * Takes action on dialog close. It removes the product
   * on confirm, else it does not do anything.
   * @param id: string
   * @param product: Product | undefined
   */
  private _openConfirmationDialog(id: string, product?: Product) {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: product ? { ...product } : null,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((x) => x),
        switchMap(() => this._onDelete(id))
      )
      .subscribe((message) => {
        this._snackBar.open(
          message || 'El producto fue eliminado correctamente.',
          ACTION_TEXT,
          {
            duration: 5000,
          }
        );
      });
  }
}
