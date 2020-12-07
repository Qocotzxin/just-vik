import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import round from 'lodash/round';
import { forkJoin, Observable, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  switchMap,
} from 'rxjs/operators';
import { Product } from 'src/app/model/product';
import { Sale, TransactionType } from 'src/app/model/sale';
import { CollectionsService } from 'src/app/services/collections.service';
import { COLLECTION_FIELDS } from 'src/app/utils/collections';
import { ACTION_TEXT } from 'src/app/utils/messages';
import { maxStock } from 'src/app/utils/validators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sales-form',
  styleUrls: ['./sales-form.component.scss'],
  templateUrl: 'sales-form.component.html',
})
export class SalesFormComponent implements OnInit {
  /**
   * List of products for product select field.
   * @public
   * @property
   */
  @Input() products: Observable<Product[]> = of([]);

  /**
   * Boolean to set loading state.
   * @public
   * @property
   */
  loading = false;

  /**
   * List of transaction types for select field (% || $).
   * @public
   * @property
   */
  operationTypes = [TransactionType.amount, TransactionType.percentage];

  /**
   * Sale form.
   * @public
   * @property
   */
  form: FormGroup = new FormGroup(
    {
      product: new FormControl(null, [Validators.required]),
      quantity: new FormControl(0, [Validators.required, Validators.min(1)]),
      salesPrice: new FormControl({ value: 0, disabled: true }),
      remainingStock: new FormControl({
        value: 0,
        disabled: true,
      }),
      salesTotal: new FormControl({
        value: 0,
        disabled: true,
      }),
      discountType: new FormControl(TransactionType.percentage),
      discount: new FormControl(0),
      extraChargeType: new FormControl(TransactionType.percentage),
      extraCharge: new FormControl(0),
      lastModification: new FormControl(),
    },
    [maxStock]
  );

  /**
   * Original form values to reset the form.
   */
  originalValues = this.form.value;

  constructor(
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _collections: CollectionsService
  ) {}

  async ngOnInit() {
    this.form.valueChanges
      .pipe(
        filter((sale: Sale) => !!sale.product),
        distinctUntilChanged(this._setUpdateConditions)
      )
      .subscribe(this._updateFormValues);
  }

  /**
   * Submits form information to create a new sale.
   * @async
   * @public
   * @method
   * @param formDirective: FormGroupDirective
   */
  onSubmit(formDirective: FormGroupDirective) {
    if (!this.form.valid) {
      return;
    }

    const product = this.form.get(COLLECTION_FIELDS.PRODUCT)?.value;
    this.loading = true;

    this._collections.user
      .pipe(
        switchMap((user) => {
          return forkJoin([
            // Adds the sale.
            this._collections.salesCollection(user).add({
              ...this.form.getRawValue(),
              product: { name: product.name, id: product.id },
              lastModification: new Date(),
            }),
            // Updates product stock.
            this._collections.productDoc(user, product.id).update({
              stock:
                product.stock -
                this.form.get(COLLECTION_FIELDS.QUANTITY)?.value,
            }),
          ]).pipe(
            catchError(() =>
              of('No se pudo guardar la venta. Por favor intentá nuevamente.')
            )
          );
        })
      )
      .subscribe((data) => {
        this.loading = false;
        if (typeof data === 'string') {
          this._openSnackBar(data, ACTION_TEXT);
          return;
        }

        formDirective.resetForm();
        this.form.reset(this.originalValues);
        this._openSnackBar('La venta se guardó con éxito.', ACTION_TEXT);
      });
  }

  /**
   * Calculates new form values based on
   * the selected product price/quantity.
   * @method
   * @private
   * @param sale Sale
   */
  private _updateFormValues = (sale: Sale) => {
    const product = sale.product as Product;
    let salesTotal = +product.salesUnitPrice * +sale.quantity;

    salesTotal = round(
      sale.discountType === TransactionType.amount
        ? salesTotal - (+sale.discount || 0)
        : salesTotal - ((+sale.discount || 0) * salesTotal) / 100,
      2
    );

    salesTotal = round(
      sale.extraChargeType === TransactionType.amount
        ? salesTotal + (+sale.extraCharge || 0)
        : salesTotal + ((+sale.extraCharge || 0) * salesTotal) / 100,
      2
    );

    this.form.patchValue(
      {
        salesPrice: +product.salesUnitPrice,
        remainingStock: +product.stock - (+sale.quantity || 0),
        salesTotal,
      },
      { emitEvent: false }
    );
  };

  /**
   * Opens a snackbar with a specified message and label.
   * @method
   * @private
   * @param message: string
   * @param label: string
   */
  private _openSnackBar(message: string, label: string) {
    this._snackBar.open(message, label, {
      duration: 5000,
    });
  }

  /**
   * Conditions to meet in order to proceed for auto
   * calculatio of form values.
   * @method
   * @private
   * @param p: Sale
   * @param n: Sale
   * @returns boolean
   */
  private _setUpdateConditions = (s: Sale, n: Sale) => {
    return (
      s.product === n.product &&
      s.quantity === n.quantity &&
      s.discount === n.discount &&
      s.discountType === n.discountType &&
      s.extraCharge === n.extraCharge &&
      s.extraChargeType === n.extraChargeType
    );
  };
}
