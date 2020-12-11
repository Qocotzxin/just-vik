import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Product } from 'src/app/model/product';
import { CollectionsService } from 'src/app/services/collections.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'sales.component.html',
})
export class SalesComponent implements OnInit {
  views = {
    form: 'form',
    chart: 'chart',
  };
  product$!: Observable<Product[]>;
  saleChanges$ = of([]);
  loading = true;
  view = this.views.form;

  title = 'Agregar Venta';

  constructor(
    private _router: Router,
    public _collections: CollectionsService
  ) {}

  ngOnInit() {
    this.product$ = this._collections.user.pipe(
      switchMap((user) =>
        this._collections.productsCollectionChanges(user).pipe(
          map((data) => this._collections.mapCollectionDates<Product>(data)),
          tap(() => (this.loading = false)),
          catchError(() => {
            this._router.navigate(['']);
            return of([]);
          })
        )
      )
    );
  }

  setView(view: string) {
    this.view = view;
    this.title = view === this.views.chart ? 'Últimas Ventas' : 'Agregar Venta';
  }
}
