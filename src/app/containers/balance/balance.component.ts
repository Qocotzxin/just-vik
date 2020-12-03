import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import Chart from 'chart.js';
import round from 'lodash/round';
import sum from 'lodash/sum';
import sumBy from 'lodash/sumBy';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Lapse } from 'src/app/model/chart';
import { GenericObject } from 'src/app/model/generic';
import { Product } from 'src/app/model/product';
import { Sale } from 'src/app/model/sale';
import { dateFnsFormat, DATE_FORMATS, LABELS } from 'src/app/utils/dates';

const WHITE = '#fff';

@Component({
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

  userAndLapseSubscription$ = combineLatest([this.selected$, this._auth.user]);

  constructor(
    private _afs: AngularFirestore,
    private _cd: ChangeDetectorRef,
    private _router: Router,
    private _auth: AngularFireAuth
  ) {}

  async ngOnInit() {
    this.userAndLapseSubscription$
      .pipe(
        tap(() => {
          if (this.chart) {
            this.chart.destroy();
          }
          this.loading = true;
        }),
        map((data) => ({ lapse: data[0], uid: data[1]?.uid })),
        takeUntil(this._unsubscribe$),
        switchMap((data) => {
          return combineLatest([
            this._afs
              .collection(`users/${data.uid}/products`, (ref) =>
                ref.where(
                  'lastModification',
                  '>=',
                  LABELS[data.lapse].condition()
                )
              )
              .valueChanges() as Observable<Product[]>,
            this._afs
              .collection(`users/${data.uid}/sales`, (ref) =>
                ref.where(
                  'lastModification',
                  '>=',
                  LABELS[data.lapse].condition()
                )
              )
              .valueChanges() as Observable<Sale[]>,
          ]).pipe(
            takeUntil(this._unsubscribe$),
            map(([products, sales]) => {
              return {
                'Inversión Neta': round(
                  sum(products.map((p) => p.unitPrice * p.stock)),
                  2
                ),
                'Inversión Bruta': round(
                  sum(products.map((p) => p.grossUnitPrice * p.stock)),
                  2
                ),
                'Ventas Totales': round(sumBy(sales, 'salesTotal'), 2),
                since: dateFnsFormat(
                  LABELS[data.lapse].condition(),
                  DATE_FORMATS.BASE
                ),
                to: dateFnsFormat(new Date(), DATE_FORMATS.BASE),
              };
            })
          );
        })
      )
      .subscribe((data) => {
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
   * Destroys the current chart (if any) and creates a new one.
   * @private
   * @property
   * @param data: GenericObject
   */
  private _createInvestmentAndProfitChart: (data: GenericObject) => void = (
    data: GenericObject
  ) => {
    if (this.chart) {
      this.chart.destroy();
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
