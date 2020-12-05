import { AngularFirestoreDocument, QueryFn } from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';

export interface Product {
  id?: string;
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
  lastModification: string | firebase.firestore.Timestamp;
}

export type ProductsCollection = (
  user: firebase.User | null,
  queryFn?: QueryFn<firebase.firestore.DocumentData> | undefined
) => Observable<Product[] | null>;

export type ProductDoc = (
  user: firebase.User | null,
  id: string
) => AngularFirestoreDocument<Product>;
