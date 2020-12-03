import { ColDef, RowClickedEvent } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DeleteBtnComponent } from 'src/app/components/ag-grid/delete-btn.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { Product } from 'src/app/model/product';
import { dateFnsFormat } from 'src/app/utils/dates';
import { AG_GRID_LOCALE_ES } from '../../utils/ag-grid-locale';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'products',
  templateUrl: 'products.component.html',
})
export class ProductsComponent implements OnInit {
  private _user!: firebase.User | null;
  private _deleteItemId = '';
  products!: Observable<Product[]>;
  loading = true;
  localeText = AG_GRID_LOCALE_ES;

  frameworkComponents = {
    deleteBtnComponent: DeleteBtnComponent,
  };

  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'Eliminar',
      cellRenderer: 'deleteBtnComponent',
      cellRendererParams: {
        clicked: (field: string) => {
          this._deleteItemId = field;
        },
      },
    },
    {
      field: 'name',
      headerName: 'Nombre',
      sortable: true,
      filter: true,
    },
    {
      field: 'stock',
      headerName: 'Stock',
      sortable: true,
      filter: true,
    },
    {
      field: 'unitPrice',
      headerName: 'Precio Unitario Neto',
      sortable: true,
      filter: true,
    },
    {
      field: 'transportCost',
      headerName: 'Precio de Transporte',
      sortable: true,
      filter: true,
    },
    {
      field: 'otherTaxes',
      headerName: 'Otros impuestos',
      sortable: true,
      filter: true,
    },
    {
      field: 'grossUnitPrice',
      headerName: 'Precio Unitario Bruto',
      sortable: true,
      filter: true,
    },
    {
      field: 'salesUnitPrice',
      headerName: 'Precio Unitario de Venta',
      sortable: true,
      filter: true,
    },
    {
      field: 'expectedProfitPercentage',
      headerName: 'Ganancia (%)',
      sortable: true,
      filter: true,
    },
    {
      field: 'estimatedProfit',
      headerName: 'Ganancia ($)',
      sortable: true,
      filter: true,
    },
    {
      field: 'lastModification',
      headerName: 'Fecha de creación',
      sortable: true,
      filter: true,
    },
  ];

  constructor(
    private _afs: AngularFirestore,
    private _auth: AngularFireAuth,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private _cd: ChangeDetectorRef,
    public router: Router
  ) {}

  async ngOnInit() {
    try {
      this._user = await this._auth.currentUser;
    } catch {
      this.router.navigate(['']);
    }

    this.products = (this._afs
      .collection(`users/${this._user?.uid}/products`)
      .valueChanges({ idField: 'id' }) as Observable<Product[]>).pipe(
      map((data) => {
        this.loading = false;
        return data.map((p) => ({
          ...p,
          lastModification: dateFnsFormat(
            (p.lastModification as firebase.firestore.Timestamp).toDate()
          ),
        }));
      })
    ) as Observable<Product[]>;
    this._cd.detectChanges();
  }

  /**
   * Takes action when the user clicks any table cell.
   * It either, opens removal dialog, or routes the user
   * to product edition page.
   * @param e {RowClickedEvent}
   * @param products {Product[]}
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

  private async _onDelete(id: string) {
    try {
      await this._afs
        .doc<Product>(`users/${this._user?.uid}/products/${id}`)
        .delete();
      this._snackBar.open(
        'El producto fue eliminado correctamente.',
        'CERRAR',
        {
          duration: 5000,
        }
      );
    } catch {
      this._snackBar.open('No se pudo borrar el producto.', 'CERRAR', {
        duration: 5000,
      });
    }
  }

  private _openConfirmationDialog(id: string, product?: Product) {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: product ? { ...product } : null,
    });

    dialogRef
      .afterClosed()
      .pipe(filter((x) => x))
      .subscribe(() => this._onDelete(id));
  }
}
