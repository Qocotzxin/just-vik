import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { Product, ProductDoc, ProductsCollection } from '../model/product';
import { Sale, SaleDoc, SalesCollection } from '../model/sale';
import { COLLECTIONS, collectionWithIdConfig } from '../utils/collections';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  /**
   * Retrieves an observable for products collection.
   * @param user: firebase.User | undefined
   * @param queryFn: QueryFn<firebase.firestore.DocumentData> | undefined
   */
  productsCollection: ProductsCollection = (user, queryFn?) =>
    this._afs
      .collection(
        `${COLLECTIONS.USERS}/${user?.uid}/${COLLECTIONS.PRODUCTS}`,
        queryFn
      )
      .valueChanges(collectionWithIdConfig) as Observable<Product[]>;

  /**
   * Retrieves an observable for sales collection.
   * @param user: firebase.User | undefined
   * @param queryFn: QueryFn<firebase.firestore.DocumentData> | undefined
   */
  salesCollection: SalesCollection = (user, queryFn?) =>
    this._afs
      .collection(
        `${COLLECTIONS.USERS}/${user?.uid}/${COLLECTIONS.SALES}`,
        queryFn
      )
      .valueChanges(collectionWithIdConfig) as Observable<Sale[]>;

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
}
