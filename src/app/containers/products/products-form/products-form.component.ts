import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  AngularFirestoreCollection,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import round from 'lodash/round';
import { combineLatest, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { Product } from 'src/app/model/product';
import { CollectionsService } from 'src/app/services/collections.service';
import { COLLECTION_FIELDS } from 'src/app/utils/collections';
import { ACTION_TEXT } from 'src/app/utils/messages';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'products-form.component.html',
  styleUrls: ['./products-form.component.scss'],
})
export class ProductsFormComponent implements OnInit, OnDestroy {
  private _productsCollection!: AngularFirestoreCollection<Product>;
  private _productsDoc: AngularFirestoreDocument<Product> | null = null;
  private _unsubscribe$ = new Subject<void>();
  private _lastSalesUnitPrice = 0;
  private _userModifiedSales = false;

  /**
   * Button action text.
   */
  buttonAction = 'Agregar';

  /**
   * Product form.
   */
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    stock: new FormControl(0, [Validators.required]),
    unitPrice: new FormControl(0, [Validators.required]),
    transportCost: new FormControl(0, [Validators.required]),
    taxes: new FormControl(21),
    otherTaxes: new FormControl(0),
    grossUnitPrice: new FormControl({
      value: 0,
      disabled: true,
    }),
    expectedProfitPercentage: new FormControl(0, [Validators.required]),
    salesUnitPrice: new FormControl(0, [Validators.required]),
    estimatedProfit: new FormControl({
      value: 0,
      disabled: true,
    }),
    lastModification: new FormControl(''),
  });

  /**
   * Flag to hide/show loading state.
   */
  loading = false;

  /**
   * Original form values to use on form reset.
   */
  originalValues = this.form.value;

  constructor(
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _collections: CollectionsService,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._loadFormDataIfEditing();
    this._setProductsCollection();
    this._listenFormChanges();
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  /**
   * Submits form data to either, add a new product,
   * or update an existing one.
   * @async
   * @method
   */
  async onSubmit(formDirective: FormGroupDirective) {
    this.loading = true;

    const values = {...this.form.getRawValue(), lastModification: new Date()};
    try {
      await (this._productsDoc
        ? this._productsDoc.update(values)
        : this._productsCollection.add(values));
      this._openSnackBar('El producto se guardó correctamente.', ACTION_TEXT);
    } catch {
      this._openSnackBar('No se pudo guardar el producto.', ACTION_TEXT);
    } finally {
      this._router.navigate(['products', 'add']);
      // In case it's a creation, form is reset since navigation won't happen.
      formDirective.resetForm();
      this.form.reset(this.originalValues);
      this.loading = false;
    }
  }

  /**
   * Opens a snackbar with a specified message and label.
   * @param message: string
   * @param label: string
   */
  private _openSnackBar(message: string, label: string) {
    this._snackBar.open(message, label, {
      duration: 5000,
    });
  }

  /**
   * Fills form with current product data when editing an existing product.
   * @private
   * @method
   */
  private _loadFormDataIfEditing() {
    this.loading = true;
    combineLatest([this._collections.user, this._activatedRoute.params])
      .pipe(
        switchMap(([user, params]) => {
          if (params.id) {
            this.buttonAction = 'Actualizar';
            this._productsDoc = this._collections.productDoc(user, params.id);
            return this._productsDoc.valueChanges();
          }

          return of(null);
        }),
        catchError(
          () =>
            'Hubo un error al cargar los datos, por favor intente nuevamente.'
        ),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((data) => {
        this.loading = false;
        if (typeof data === 'string') {
          this._openSnackBar(data, ACTION_TEXT);

          this._router.navigate(['']);
        } else {
          if (data) {
            this.form.patchValue({ ...data }, { emitEvent: false });
          }
        }

        this._cd.detectChanges();
      });
  }

  /**
   * Sets the current product collection.
   */
  private _setProductsCollection() {
    this._collections.user
      .pipe(
        tap(
          (user) =>
            (this._productsCollection = this._collections.productsCollection(
              user
            ))
        ),
        map((data) => null),
        catchError(() => of('Hubo un error, por favor intente nuevamente.')),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((data) => {
        if (data) {
          this._openSnackBar(data, ACTION_TEXT);
        }
      });
  }

  /**
   * Subscribes to form and salesUnitPrice changes to
   * update form calculations.
   */
  private _listenFormChanges() {
    this.form.valueChanges
      .pipe(
        tap(this._updateEstimatedProfit),
        distinctUntilChanged(this._distinctCondition),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(this._updateFormValues);

    this.form
      .get(COLLECTION_FIELDS.SALES_UNIT_PRICE)
      ?.valueChanges.pipe(takeUntil(this._unsubscribe$))
      .subscribe(this._updateExpectedProfit);
  }

  /**
   * Conditions to meet in order to proceed for auto
   * calculation of form values.
   * @param p {Product}
   * @param n {Product}
   */
  private _distinctCondition = (p: Product, n: Product) => {
    return (
      p.unitPrice === n.unitPrice &&
      p.transportCost === n.transportCost &&
      p.expectedProfitPercentage === n.expectedProfitPercentage &&
      p.otherTaxes === n.otherTaxes &&
      p.taxes === n.taxes &&
      p.stock === n.stock
    );
  };

  /**
   * Updates the estimated profit only if the sales price
   * is not the same as the last one.
   * @param p: Product
   */
  private _updateEstimatedProfit = (p: Product) => {
    if (+p.salesUnitPrice !== this._lastSalesUnitPrice) {
      this._lastSalesUnitPrice = +p.salesUnitPrice;
      this.form.patchValue(
        {
          estimatedProfit: round(
            +this._lastSalesUnitPrice -
              +this.form.getRawValue().grossUnitPrice || 0,
            2
          ),
        },
        { emitEvent: false }
      );
    }
  };

  /**
   * Updates the required form values to show
   * the correct calculations based on prices.
   * @param data: Product
   */
  private _updateFormValues = (data: Product) => {
    if (!this._userModifiedSales) {
      const grossUnitPrice = round(
        (+data.unitPrice * +data.taxes) / 100 +
          +data.unitPrice +
          +data.transportCost +
          (data.unitPrice * data.otherTaxes) / 100,
        2
      );
      const salesUnitPrice = round(
        (grossUnitPrice * data.expectedProfitPercentage) / 100 +
          +grossUnitPrice,
        2
      );
      const estimatedProfit = round(+salesUnitPrice - grossUnitPrice, 2);
      this.form.patchValue(
        {
          grossUnitPrice,
          salesUnitPrice,
          estimatedProfit,
        },
        { emitEvent: false }
      );
    }

    this._userModifiedSales = false;
  };

  /**
   * Updates the expectedProfit.
   * @param value: number
   */
  private _updateExpectedProfit = (value: number) => {
    this._userModifiedSales = true;
    this.form.patchValue(
      {
        expectedProfitPercentage: round(
          (+value * 100) /
            +this.form.get(COLLECTION_FIELDS.GROSS_UNIT_PRICE)?.value -
            100,
          2
        ),
      },
      { emitEvent: false }
    );
  };
}
