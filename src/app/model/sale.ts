import {
  AngularFirestoreCollection,
  AngularFirestoreDocument,
  QueryFn,
} from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { FirebaseModel } from './firebase';
import { Product } from './product';

export interface Sale extends FirebaseModel {
  product: Partial<Product>;
  quantity: number;
  salesPrice: number;
  salesTotal: number;
  salesPriceDiff: number;
  discountType: TransactionType;
  discount: number;
  extraChargeType: TransactionType;
  extraCharge: number;
}

export enum TransactionType {
  percentage = 'Porcentaje (%)',
  amount = 'Monto Directo ($)',
}

export type SalesCollection = (
  user: firebase.User | null,
  queryFn?: QueryFn<firebase.firestore.DocumentData> | undefined
) => AngularFirestoreCollection<Sale>;

export type SalesCollectionChanges = (
  user: firebase.User | null,
  queryFn?: QueryFn<firebase.firestore.DocumentData> | undefined
) => Observable<Sale[]>;

export type SaleDoc = (
  user: firebase.User | null,
  id: string
) => AngularFirestoreDocument<Sale>;
