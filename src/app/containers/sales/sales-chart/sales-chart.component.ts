import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormControl } from '@angular/forms';
import Chart from 'chart.js';
import 'chartjs-adapter-date-fns';
import firebase from 'firebase/app';
import round from 'lodash/round';
import { Observable, Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Lapse } from 'src/app/model/chart';
import { Sale } from 'src/app/model/sale';
import { getRandomColor } from 'src/app/utils/colors';
import { dateFnsFormat, DATE_FORMATS, LABELS } from 'src/app/utils/dates';

const WHITE = '#fff';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sales-chart',
  templateUrl: 'sales-chart.component.html',
  styleUrls: ['./sales-chart.component.scss'],
})
export class SalesChartComponent implements OnInit, AfterViewInit, OnDestroy {
  private _unsubscribe$ = new Subject<void>();
  private _labels = LABELS[Lapse.week].value();
  private _type!: string;

  /**
   * Ref to canvas element.
   */
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;

  /**
   * User ID to use with collections.
   */
  @Input() userId?: string;

  get type(): string {
    return this._type;
  }

  @Input()
  set type(val: string) {
    this._type = val;
    this.selected.setValue(Lapse.week);
  }

  lapses = [Lapse.week, Lapse.month, Lapse.year];

  selected = new FormControl();

  loading = true;

  constructor(private _afs: AngularFirestore, private _cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.selected.valueChanges
      .pipe(
        tap(() => {
          this.loading = true;
        }),
        takeUntil(this._unsubscribe$),
        switchMap((lapse: Lapse) => {
          this._labels = LABELS[lapse].value();
          return (this._afs
            .collection(`users/${this.userId}/sales`, (ref) =>
              ref.where('lastModification', '>=', LABELS[lapse].condition())
            )
            .valueChanges() as Observable<Sale[]>).pipe(
            takeUntil(this._unsubscribe$),
            map((s) => {
              return !this.type.includes('product')
                ? this._setSalesInTimeChartMapping(s, lapse)
                : this._setSalesPerProductChartMapping(s, lapse);
            })
          );
        })
      )
      .subscribe((data) =>
        !this.type.includes('product')
          ? this._createSalesInTimeChart(data)
          : this._createSalesPerProductChart(data)
      );
  }

  ngAfterViewInit() {
    this.selected.setValue(Lapse.week);
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  private _createSalesInTimeChart = (data: {
    [id: string]: number | string;
  }) => {
    if (this.chart) {
      this.chart.destroy();
    }

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
    this.loading = false;
    this._cd.detectChanges();
  };

  private _createSalesPerProductChart = (data: {
    [id: string]: number | string;
  }) => {
    if (this.chart) {
      this.chart.destroy();
    }

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
            backgroundColor: this._labels.map(l => getRandomColor()),
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
    this.loading = false;
    this._cd.detectChanges();
  };

  private _setSalesInTimeChartMapping(s: Sale[], lapse: Lapse) {
    return s.reduce((acc: { [id: string]: number }, cur) => {
      const lastModification = LABELS[lapse].keys(
        (cur.lastModification as firebase.firestore.Timestamp).toDate(),
        this._labels
      );

      if (!acc[lastModification]) {
        acc[lastModification] = cur.salesTotal;
      } else {
        acc[lastModification] += cur.salesTotal;
      }

      return acc;
    }, {});
  }

  private _setSalesPerProductChartMapping(s: Sale[], lapse: Lapse) {
    const salesPerProduct = s.reduce(
      (acc: { [id: string]: number | string }, cur) => {
        if (!acc[cur.product.name!]) {
          acc[cur.product.name!] = cur.salesTotal;
        } else {
          acc[cur.product.name!] = cur.salesTotal + +acc[cur.product.name!];
        }

        return acc;
      },
      {}
    );

    this._labels = Object.keys(salesPerProduct);

    salesPerProduct.init = dateFnsFormat(
      LABELS[lapse].condition(),
      DATE_FORMATS.BASE
    );

    return salesPerProduct;
  }
}
