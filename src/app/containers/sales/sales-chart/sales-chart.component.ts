import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import Chart from 'chart.js';
import firebase from 'firebase/app';
import round from 'lodash/round';
import { combineLatest, Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Lapse, TypeSelectorOptions } from 'src/app/model/chart';
import { GenericObject } from 'src/app/model/generic';
import { Sale } from 'src/app/model/sale';
import { CollectionsService } from 'src/app/services/collections.service';
import {
  COLLECTION_COMPARISONS,
  COLLECTION_FIELDS,
} from 'src/app/utils/collections';
import { getRandomColor } from 'src/app/utils/colors';
import {
  CHART_DATE_INFO,
  dateFnsFormat,
  DATE_FORMATS,
} from 'src/app/utils/dates';

const WHITE = '#fff';
const CHART_BASIS = {
  PRODUCT: 'product',
  TIME: 'time',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sales-chart',
  templateUrl: 'sales-chart.component.html',
  styleUrls: ['./sales-chart.component.scss'],
})
export class SalesChartComponent implements OnInit, OnDestroy {
  private _unsubscribe$ = new Subject<void>();
  private _labels = CHART_DATE_INFO[Lapse.week].value();

  /**
   * Ref to canvas element.
   */
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;

  /**
   * Chart class to programatically take action on it.
   */
  chart: Chart | null = null;

  /**
   * Type of chart to show (time/line or product/doughnut).
   */
  type = CHART_BASIS.TIME;

  /**
   * Type selector configuration options.
   */
  typeSelectorOptions: TypeSelectorOptions[] = [
    {
      type: 'time',
      text: 'Por día',
    },
    {
      type: 'product',
      text: 'Por producto',
    },
  ];

  /**
   * Subject for type selector to emit current type.
   */
  selectedType$ = new Subject<string>();

  /**
   * Selected time frame.
   */
  selected$ = new Subject<Lapse>();

  /**
   * Flag to show/hide spinner.
   */
  loading = true;

  query = (lapse: Lapse) => (ProductsCollection: any) =>
    ProductsCollection.where(
      COLLECTION_FIELDS.LAST_MODIFICATION,
      COLLECTION_COMPARISONS.GREATER_OR_EQUAL,
      CHART_DATE_INFO[lapse].condition()
    );

  constructor(
    private _collections: CollectionsService,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Stream is based on time frame change.
    combineLatest([this.selected$, this._collections.user, this.selectedType$])
      .pipe(
        // Destroy previous chart (if any) and intialize loading state.
        tap(() => {
          if (this.chart) {
            this.chart.destroy();
          }
          this.loading = true;
        }),
        // Retrieves Firebase data.
        switchMap(([lapse, user, type]) => {
          this._labels = CHART_DATE_INFO[lapse].value();
          return this._collections
            .salesCollectionChanges(user, this.query(lapse))
            .pipe(
              // Maps Firebase data to use in chart.
              map((s) => {
                return {
                  ...(type === CHART_BASIS.TIME
                    ? this._setSalesInTimeChartMapping(s, lapse)
                    : this._setSalesPerProductChartMapping(s, lapse)),
                  type,
                };
              }),
              // Unsubscribe.
              takeUntil(this._unsubscribe$)
            );
        })
      )
      .subscribe((data) => {
        data.type === CHART_BASIS.TIME
          ? this._createSalesInTimeChart(data)
          : this._createSalesPerProductChart(data);

        this.loading = false;
        this._cd.detectChanges();
      });
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  /**
   * Destroys the current chart (if any) and creates a new
   * time based line chart.
   * @private
   * @property
   * @param data: GenericObject
   */
  private _createSalesInTimeChart: (data: GenericObject) => void = (
    data: GenericObject
  ) => {
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

  /**
   * Destroys the current chart (if any) and creates a new
   * product based doughnut chart.
   * @private
   * @property
   * @param data: GenericObject
   */
  private _createSalesPerProductChart: (data: GenericObject) => void = (
    data: GenericObject
  ) => {
    const init = data.init;
    delete data.init;

    this.chart = new Chart(this.chartRef.nativeElement.getContext('2d')!, {
      type: 'doughnut',
      data: {
        labels: this._labels,
        datasets: [
          {
            label: 'Ventas ($)',
            data: this._labels.map((l) => round(+data[l], 2) || 0),
            backgroundColor: this._labels.map((l) => getRandomColor()),
            borderColor: WHITE,
          },
        ],
      },
      options: {
        legend: {
          labels: {
            fontColor: WHITE,
            fontSize: 12,
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: `${init} a ${dateFnsFormat(new Date(), DATE_FORMATS.BASE)}`,
          fontColor: WHITE,
          fontStyle: 'italic',
        },
      },
    });
  };

  /**
   * Maps the sales information to fill the time based chart.
   * @private
   * @method
   * @param s: Array<Sale>
   * @param lapse: Lapse
   * @returns GenericObject
   */
  private _setSalesInTimeChartMapping(s: Sale[], lapse: Lapse): GenericObject {
    return s.reduce((acc: GenericObject, cur) => {
      const lastModification = CHART_DATE_INFO[lapse].keys(
        (cur.lastModification as firebase.firestore.Timestamp).toDate()
      );

      if (!acc[lastModification]) {
        acc[lastModification] = cur.salesTotal;
      } else {
        acc[lastModification] += cur.salesTotal;
      }

      return acc;
    }, {});
  }

  /**
   * Maps the sales information to fill the product based chart.
   * @private
   * @method
   * @param s: Array<Sale>
   * @param lapse: Lapse
   * @returns GenericObject
   */
  private _setSalesPerProductChartMapping(
    s: Sale[],
    lapse: Lapse
  ): GenericObject {
    const salesPerProduct = s.reduce((acc: GenericObject, cur) => {
      if (!acc[cur.product.name!]) {
        acc[cur.product.name!] = cur.salesTotal;
      } else {
        acc[cur.product.name!] = cur.salesTotal + +acc[cur.product.name!];
      }

      return acc;
    }, {});

    this._labels = Object.keys(salesPerProduct);

    salesPerProduct.init = dateFnsFormat(
      CHART_DATE_INFO[lapse].condition(),
      DATE_FORMATS.BASE
    );

    return salesPerProduct;
  }
}
