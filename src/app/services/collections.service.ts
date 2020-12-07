import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { FirebaseModel } from '../model/firebase';
import {
  Product,
  ProductDoc,
  ProductsCollection,
  ProductsCollectionChanges,
} from '../model/product';
import {
  Sale,
  SaleDoc,
  SalesCollection,
  SalesCollectionChanges,
} from '../model/sale';
import { COLLECTIONS, COLLECTION_CONFIG } from '../utils/collections';
import { dateFnsFormat } from '../utils/dates';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  /**
   * Retrieves an observable for products collection.
   * @param user: firebase.User | undefined
   */
  productsCollection: ProductsCollection = (user) =>
    this._afs.collection<Product>(
      `${COLLECTIONS.USERS}/${user?.uid}/${COLLECTIONS.PRODUCTS}`
    );

  /**
   * Retrieves an observable for products collection valueChanges.
   * @param user: firebase.User | undefined
   * @param queryFn: QueryFn<firebase.firestore.DocumentData> | undefined
   */
  productsCollectionChanges: ProductsCollectionChanges = (user, queryFn?) =>
    this._afs
      .collection(
        `${COLLECTIONS.USERS}/${user?.uid}/${COLLECTIONS.PRODUCTS}`,
        queryFn
      )
      .valueChanges(COLLECTION_CONFIG) as Observable<Product[]>;

  /**
   * Retrieves an observable for products collection.
   * @param user: firebase.User | undefined
   */
  salesCollection: SalesCollection = (user) =>
    this._afs.collection<Sale>(
      `${COLLECTIONS.USERS}/${user?.uid}/${COLLECTIONS.SALES}`
    );

  /**
   * Retrieves an observable for sales collection.
   * @param user: firebase.User | undefined
   * @param queryFn: QueryFn<firebase.firestore.DocumentData> | undefined
   */
  salesCollectionChanges: SalesCollectionChanges = (user, queryFn?) =>
    this._afs
      .collection(
        `${COLLECTIONS.USERS}/${user?.uid}/${COLLECTIONS.SALES}`,
        queryFn
      )
      .valueChanges(COLLECTION_CONFIG) as Observable<Sale[]>;

  /**
   * Retrieves a specified product document.
   * @param user: firebase.User | null
   * @param id: string
   */
  productDoc: ProductDoc = (user, id) =>
    this._afs.doc<Product>(
      `${COLLECTIONS.USERS}/${user?.uid}/${COLLECTIONS.PRODUCTS}/${id}`
    );

  /**
   * Retrieves a specified sale document.
   * @param user: firebase.User | null
   * @param id: string
   */
  saleDoc: SaleDoc = (user, id) =>
    this._afs.doc<Sale>(
      `${COLLECTIONS.USERS}/${user?.uid}/${COLLECTIONS.SALES}/${id}`
    );

  /**
   * Retrieves an observable for the current user.
   */
  user: Observable<firebase.User | null> = this._auth.user;

  constructor(private _afs: AngularFirestore, private _auth: AngularFireAuth) {}

  /**
   * Maps Firebase dates to js Dates.
   * @param data: Array<Product | Sale>
   * @returns Array<Product | Sale>
   */
  mapCollectionDates<T extends FirebaseModel>(data: T[]): T[] {
    return data.map((p) => ({
      ...p,
      lastModification: dateFnsFormat(
        (p.lastModification as firebase.firestore.Timestamp).toDate()
      ),
    }));
  }
}
