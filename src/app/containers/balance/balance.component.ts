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
import round from 'lodash/round';
import sum from 'lodash/sum';
import sumBy from 'lodash/sumBy';
import { combineLatest, of, Subject } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Lapse } from 'src/app/model/chart';
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./balance.component.scss'],
  templateUrl: 'balance.component.html',
})
export class BalanceComponent implements OnInit, OnDestroy {
  private _unsubscribe$ = new Subject<void>();

  /**
   * Subject to provide to lapse selector.
   */
  selected$ = new Subject<Lapse>();

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
  ]);

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
        // Converts data for easier manipulation.
        map((data) => ({ lapse: data[0], user: data[1] })),
        // Retrieves Firebase data (Products and Sales)
        switchMap((data) => {
          return combineLatest([
            this._collections.productsCollectionChanges(
              data.user,
              this.query(data.lapse)
            ),
            this._collections.salesCollectionChanges(
              data.user,
              this.query(data.lapse)
            ),
          ]).pipe(
            // Maps Firebase data for chart.
            map(([products, sales]) => {
              return this._mapDataForChart(products, sales, data.lapse);
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
        console.log(data);
        this._createInvestmentAndProfitChart(data);
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
  private _mapDataForChart = (
    products: Product[] = [],
    sales: Sale[] = [],
    lapse: Lapse
  ): GenericObject => {
    console.log(products);
    console.log(sales);
    return {
      'Inversión Neta': round(
        sum(products.map((p) => p.unitPrice * p.stock)),
        2
      ),
      'Inversión Bruta': round(
        sum(products.map((p) => p.grossUnitPrice * p.stock)),
        2
      ),
      'Ventas Totales': round(sumBy(sales, COLLECTION_FIELDS.SALES_TOTAL), 2),
      since: dateFnsFormat(
        CHART_DATE_INFO[lapse].condition(),
        DATE_FORMATS.BASE
      ),
      to: dateFnsFormat(new Date(), DATE_FORMATS.BASE),
    };
  };

  /**
   * Destroys the current chart (if any) and creates a new one.
   * @private
   * @property
   * @param data: GenericObject
   */
  private _createInvestmentAndProfitChart: (
    data: GenericObject | null
  ) => void = (data: GenericObject | null) => {
    if (!data) {
      return;
    }

    const since = data.since;
    const to = data.to;
    delete data.since;
    delete data.to;

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
}
