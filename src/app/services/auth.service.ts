import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user: Observable<firebase.User | null> = of(null);

  constructor(public auth: AngularFireAuth) {
    this.user = this.auth.user;
  }
}
