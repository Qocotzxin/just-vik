import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from 'src/app/model/product';
import { dateFnsFormat } from 'src/app/utils/dates';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'sales.component.html',
})
export class SalesComponent implements OnInit {
  views = {
    form: 'form',
    salesTimeChart: 'sales-in-time-chart',
    salesProductChart: 'sales-per-product-chart',
  };
  user!: firebase.User | null;
  product$!: Observable<Product[]>;
  loading = true;
  view = this.views.form;

  constructor(
    private _afs: AngularFirestore,
    private _router: Router,
    private _auth: AngularFireAuth
  ) {}

  async ngOnInit() {
    try {
      this.user = await this._auth.currentUser;
    } catch {
      this._router.navigate(['']);
    }

    this.product$ = (this._afs
      .collection(`users/${this.user?.uid}/products`)
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
  }
}
