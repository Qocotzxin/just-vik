import {
  AngularFirestoreCollection,
  AngularFirestoreDocument,
  QueryFn,
} from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { FirebaseModel } from './firebase';

export interface Product extends FirebaseModel {
  name: string;
  stock: number;
  unitPrice: number;
  transportCost: number;
  taxes: number;
  otherTaxes: number;
  grossUnitPrice: number;
  expectedProfitPercentage: number;
  salesUnitPrice: number;
  estimatedProfit: number;
}

export type ProductsCollection = (
  user: firebase.User | null,
  queryFn?: QueryFn<firebase.firestore.DocumentData> | undefined
) => AngularFirestoreCollection<Product>;

export type ProductsCollectionChanges = (
  user: firebase.User | null,
  queryFn?: QueryFn<firebase.firestore.DocumentData> | undefined
) => Observable<Product[]>;

export type ProductDoc = (
  user: firebase.User | null,
  id: string
) => AngularFirestoreDocument<Product>;
