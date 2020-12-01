import firebase from 'firebase/app';
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
  amount = 'Monto Directo ($)'
}
