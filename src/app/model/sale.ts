import { AngularFirestoreDocument, QueryFn } from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { Product } from './product';

export interface Sale {
  id?: string;
  product: Partial<Product>;
  quantity: number;
  salesPrice: number;
  salesTotal: number;
  salesPriceDiff: number;
  discountType: TransactionType;
  discount: number;
  extraChargeType: TransactionType;
  extraCharge: number;
  lastModification: string | firebase.firestore.Timestamp;
}

export enum TransactionType {
  percentage = 'Porcentaje (%)',
  amount = 'Monto Directo ($)',
}

export type SalesCollection = (
  user: firebase.User | null,
  queryFn?: QueryFn<firebase.firestore.DocumentData> | undefined
) => Observable<Sale[] | null>;

export type SaleDoc = (
  user: firebase.User | null,
  id: string
) => AngularFirestoreDocument<Sale>;
