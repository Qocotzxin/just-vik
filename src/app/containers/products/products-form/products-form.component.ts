import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
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
import firebase from 'firebase/app';
import round from 'lodash/round';
import { of, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { Product } from 'src/app/model/product';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'products-form.component.html',
  styleUrls: ['./products-form.component.scss'],
})
export class ProductsFormComponent implements OnInit, OnDestroy {
  private _productsCollection!: AngularFirestoreCollection<Product[]>;
  private _productsDoc!: AngularFirestoreDocument<Product>;
  private _unsubscribe$ = new Subject<void>();
  private _user: firebase.User | null = null;
  private _lastSalesUnitPrice = 0;
  private _userModifiedSales = false;

  buttonAction = 'Agregar';
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    stock: new FormControl(0, [Validators.required]),
    unitPrice: new FormControl(0, [Validators.required]),
    transportCost: new FormControl(0, [Validators.required]),
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
  loading = false;
  originalValues = this.form.value;

  constructor(
    private _afs: AngularFirestore,
    private _auth: AngularFireAuth,
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit() {
    await this._setUserAndDefineAction();
    this._productsCollection = this._afs.collection<Product[]>(
      `users/${this._user?.email}/products`
    );

    this.form.valueChanges
      .pipe(
        takeUntil(this._unsubscribe$),
        tap(this._updateEstimatedProfit),
        distinctUntilChanged(this._distinctCondition)
      )
      .subscribe(this._updateFormValues);

    this.form
      .get('salesUnitPrice')
      ?.valueChanges.pipe(takeUntil(this._unsubscribe$))
      .subscribe(this._updateExpectedProfit);
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  /**
   * @async
   * @method
   * Submits form data to either, add a new product,
   * or update an existing one.
   */
  async onSubmit(formDirective: FormGroupDirective) {
    if (!this.form.valid) {
      return;
    }

    this.loading = true;
    this.form.patchValue({ lastModification: new Date() });

    try {
      if (this._productsDoc) {
        await this._productsDoc.update(this.form.getRawValue());
      } else {
        await this._productsCollection.add(this.form.getRawValue());
      }
      this._openSnackBar('El producto se guardó correctamente.', 'CERRAR');
    } catch {
      this._openSnackBar('No se pudo guardar el producto.', 'CERRAR');
    }

    formDirective.resetForm();
    this.form.reset(this.originalValues);
    this.loading = false;
  }

  /**
   * Opens a snackbar with a specified message and label.
   * @param message {string}
   * @param label {string}
   */
  private _openSnackBar(message: string, label: string) {
    this._snackBar.open(message, label, {
      duration: 5000,
    });
  }

  private async _setUserAndDefineAction() {
    try {
      this._user = await this._auth.currentUser;
      this._activatedRoute.params
        .pipe(
          switchMap((params) => {
            if (params.id) {
              this.loading = true;
              this.buttonAction = 'Actualizar';
              this._productsDoc = this._afs.doc<Product>(
                `users/${this._user?.email}/products/${params.id}`
              );

              return this._productsDoc.valueChanges();
            }

            return of(null);
          })
        )
        .subscribe((p) => {
          this.loading = false;
          return p ? this.form.patchValue({ ...p }) : p;
        });
    } catch {
      this._openSnackBar(
        'No se pudo encontrar el usuario. Por favor intente nuevamente.',
        'CERRAR'
      );
      this._router.navigate(['']);
    }
  }

  /**
   * Conditions to meet in order to proceed for auto
   * calculatio of form values.
   * @param p {Product}
   * @param n {Product}
   */
  private _distinctCondition = (p: Product, n: Product) => {
    return (
      p.unitPrice === n.unitPrice &&
      p.transportCost === n.transportCost &&
      p.expectedProfitPercentage == n.expectedProfitPercentage &&
      p.otherTaxes == n.otherTaxes
    );
  };

  /**
   * Updates the estimated profit only if the sales price
   * is not the same as the last one.
   * @param p {Product}
   */
  private _updateEstimatedProfit = (p: Product) => {
    if (+p.salesUnitPrice !== this._lastSalesUnitPrice) {
      this._lastSalesUnitPrice = +p.salesUnitPrice;
      const grossSales =
        (+this.form.getRawValue().grossUnitPrice || 0) * +p.stock;
      const priceSales = this._lastSalesUnitPrice * +p.stock;
      this.form.patchValue(
        {
          estimatedProfit: round(priceSales - grossSales, 2),
        },
        { emitEvent: false }
      );
    }
  };

  /**
   * Updates the required form values to show
   * the correct calculations based on prices.
   * @param data {Product}
   */
  private _updateFormValues = (data: Product) => {
    if (!this._userModifiedSales) {
      const grossUnitPrice = round(
        (data.unitPrice * 21) / 100 +
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
      const estimatedProfit = round(
        (+salesUnitPrice - grossUnitPrice) * data.stock,
        2
      );
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

  private _updateExpectedProfit = (value: number) => {
    this._userModifiedSales = true;
    this.form.patchValue(
      {
        expectedProfitPercentage: round(
          (+value * 100) / +this.form.get('grossUnitPrice')?.value - 100,
          2
        ),
      },
      { emitEvent: false }
    );
  };
}
