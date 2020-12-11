import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import Chart from 'chart.js';
import firebase from 'firebase/app';
import round from 'lodash/round';
import sum from 'lodash/sum';
import sumBy from 'lodash/sumBy';
import { combineLatest, of, Subject } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Lapse, TypeSelectorOptions } from 'src/app/model/chart';
import { GenericObject } from 'src/app/model/generic';
import { Product } from 'src/app/model/product';
import { Sale } from 'src/app/model/sale';
import { CollectionsService } from 'src/app/services/collections.service';
import {
  COLLECTION_COMPARISONS,
  COLLECTION_FIELDS,
} from 'src/app/utils/collections';
import {
  CHART_DATE_INFO,
  dateFnsFormat,
  DATE_FORMATS,
} from 'src/app/utils/dates';
import { ACTION_TEXT } from 'src/app/utils/messages';

const WHITE = '#fff';

const CHART_TYPES = {
  INVESTMENT_AND_SALES: 'investmentsAndSales',
  PROFITS: 'profits',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./balance.component.scss'],
  templateUrl: 'balance.component.html',
})
export class BalanceComponent implements OnInit, OnDestroy {
  private _unsubscribe$ = new Subject<void>();
  private _labels = CHART_DATE_INFO[Lapse.week].value();

  /**
   * Subject to provide to lapse selector.
   */
  selected$ = new Subject<Lapse>();

  /**
   * Type selector configuration options.
   */
  typeSelectorOptions: TypeSelectorOptions[] = [
    {
      type: 'investmentsAndSales',
      text: 'Egresos/Ingresos',
    },
    {
      type: 'profits',
      text: 'Ganancias',
    },
  ];

  /**
   * Subject for type selector to emit current type.
   */
  selectedType$ = new Subject<string>();

  /**
   * Ref to canvas element.
   */
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;

  /**
   * Chart class to programatically take action on it.
   */
  chart: Chart | null = null;

  /**
   * Flag to show/hide spinner.
   */
  loading = true;

  /**
   * Observable that combines the selected timeframe and the user information.
   */
  userAndLapseSubscription$ = combineLatest([
    this.selected$,
    this._collections.user,
    this.selectedType$,
  ]);

  /**
   * Query to be used when retrieving collections.
   * @param lapse: Lapse
   */
  query = (lapse: Lapse) => (ref: any) =>
    ref.where(
      COLLECTION_FIELDS.LAST_MODIFICATION,
      COLLECTION_COMPARISONS.GREATER_OR_EQUAL,
      CHART_DATE_INFO[lapse].condition()
    );

  constructor(
    private _cd: ChangeDetectorRef,
    private _snackbar: MatSnackBar,
    private _collections: CollectionsService
  ) {}

  async ngOnInit() {
    this.userAndLapseSubscription$
      .pipe(
        // Destroy previous chart (if any) and intialize loading state.
        tap(() => {
          if (this.chart) {
            this.chart.destroy();
          }
          this.loading = true;
        }),
        // Retrieves Firebase data (Products and Sales)
        switchMap(([lapse, user, type]) => {
          this._labels = CHART_DATE_INFO[lapse].value();
          return combineLatest([
            this._collections.productsCollectionChanges(
              user,
              this.query(lapse)
            ),
            this._collections.salesCollectionChanges(user, this.query(lapse)),
          ]).pipe(
            // Maps Firebase data for chart.
            map(([products, sales]) => {
              const mappedData =
                type === CHART_TYPES.INVESTMENT_AND_SALES
                  ? this._mapDataForInvestmentAndSalesChart(
                      products,
                      sales,
                      lapse
                    )
                  : this._mapDataForProfitsChart(products, sales, lapse);

              return { ...mappedData, type };
            }),
            // Unsubscribe
            takeUntil(this._unsubscribe$),
            catchError(() => {
              this._snackbar.open(
                'Hubo un error, por favor intente nuevamente.',
                ACTION_TEXT
              );
              return of(null);
            })
          );
        })
      )
      .subscribe((data) => {
        if (data && data.type === CHART_TYPES.INVESTMENT_AND_SALES) {
          this._createInvestmentAndSalesChart(data);
        }

        if (data && data.type === CHART_TYPES.PROFITS) {
          this._createProfitsChart(data);
        }

        this.loading = false;
        this._cd.detectChanges();
      });
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  /**
   * Maps the data to feed the chart.
   * @param products: Product[]
   * @param sales: Sale[]
   * @param lapse: Lapse
   */
  private _mapDataForInvestmentAndSalesChart = (
    products: Product[] = [],
    sales: Sale[] = [],
    lapse: Lapse
  ): GenericObject => {
    const grossInvestment = round(
      sum(products.map((p) => p.grossUnitPrice * p.stock)),
      2
    );
    const totalSales = round(sumBy(sales, COLLECTION_FIELDS.SALES_TOTAL), 2);
    return {
      'Inversión Neta': round(
        sum(products.map((p) => p.unitPrice * p.stock)),
        2
      ),
      'Inversión Bruta': grossInvestment,
      'Ventas Totales': totalSales,
      Ganancia: round(((totalSales - grossInvestment) / grossInvestment) * 100),
      since: dateFnsFormat(
        CHART_DATE_INFO[lapse].condition(),
        DATE_FORMATS.BASE
      ),
      to: dateFnsFormat(new Date(), DATE_FORMATS.BASE),
    };
  };

  /**
   * Maps the data to feed the chart.
   * @param products: Product[]
   * @param sales: Sale[]
   * @param lapse: Lapse
   */
  private _mapDataForProfitsChart = (
    products: Product[] = [],
    sales: Sale[] = [],
    lapse: Lapse
  ): GenericObject => {
    return sales.reduce((acc: GenericObject, cur) => {
      const lastModification = CHART_DATE_INFO[lapse].keys(
        (cur.lastModification as firebase.firestore.Timestamp).toDate()
      );

      const diff =
        ((cur.salesTotal - cur.product.grossUnitPrice! * cur.quantity) /
          cur.salesTotal) *
        100;

      if (!acc[lastModification]) {
        acc[lastModification] = diff;
      } else {
        acc[lastModification] += diff;
      }

      return acc;
    }, {});
  };

  /**
   * Destroys the current chart (if any) and creates a new one.
   * @private
   * @property
   * @param data: GenericObject
   */
  private _createInvestmentAndSalesChart: (
    data: GenericObject | null
  ) => void = (data: GenericObject | null) => {
    if (!data) {
      return;
    }

    const since = data.since;
    const to = data.to;
    delete data.since;
    delete data.to;
    delete data.type;
    delete data['Ganancia'];

    this.chart = new Chart(this.chartRef.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            label: 'Inversiones y Ganancias',
            data: Object.values(data),
            backgroundColor: [
              'rgba(244, 122, 121, .8)',
              'rgba(254, 226, 127, .8)',
              'rgba(139, 223, 206, .8)',
            ],
            borderWidth: 2,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        scales: {
          xAxes: [
            {
              gridLines: { color: 'rgba(240, 240, 240, .2)' },
              ticks: {
                fontColor: WHITE,
              },
            },
          ],
          yAxes: [
            {
              gridLines: { color: 'rgba(240, 240, 240, .2)' },
              ticks: {
                fontColor: WHITE,
                beginAtZero: true,
              },
            },
          ],
        },
        legend: {
          labels: {
            fontColor: WHITE,
            fontSize: 16,
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: `${since} a ${to}`,
          fontColor: WHITE,
          fontStyle: 'italic',
        },
      },
    });
  };

  /**
   * Destroys the current chart (if any) and creates a new one.
   * @private
   * @property
   * @param data: GenericObject
   */
  private _createProfitsChart: (data: GenericObject | null) => void = (
    data: GenericObject | null
  ) => {
    if (!data) {
      return;
    }

    const since = data.since;
    const to = data.to;
    delete data.since;
    delete data.to;
    delete data.type;
    delete data['Inversión Neta'];
    delete data['Inversión Bruta'];
    delete data['Ventas Totales'];

    this.chart = new Chart(this.chartRef.nativeElement.getContext('2d')!, {
      type: 'line',
      data: {
        labels: this._labels,
        datasets: [
          {
            label: 'Ventas ($)',
            data: this._labels.map((d) => round(+data[d], 2) || 0),
            backgroundColor: ['rgba(240, 240, 240, 0.3)'],
            borderColor: this._labels.map(() => 'rgba(38, 198, 218, 0.9)'),
            borderWidth: 2,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        scales: {
          xAxes: [
            {
              gridLines: { color: 'rgba(240, 240, 240, .2)' },
              ticks: {
                fontColor: WHITE,
              },
            },
          ],
          yAxes: [
            {
              gridLines: { color: 'rgba(240, 240, 240, .2)' },
              ticks: {
                fontColor: WHITE,
              },
            },
          ],
        },
        legend: {
          labels: {
            fontColor: WHITE,
            fontSize: 16,
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: `${this._labels[0]} a ${this._labels[this._labels.length - 1]}`,
          fontColor: WHITE,
          fontStyle: 'italic',
        },
      },
    });
  };
}
