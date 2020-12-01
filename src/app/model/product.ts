import firebase from 'firebase/app';

export interface Product {
  id?: string;
  name: string;
  stock: number;
  unitPrice: number;
  transportCost: number;
  otherTaxes: number;
  grossUnitPrice: number;
  expectedProfitPercentage: number;
  salesUnitPrice: number;
  estimatedProfit: number;
  lastModification: string | firebase.firestore.Timestamp;
}
