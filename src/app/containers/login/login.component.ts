import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'login',
  templateUrl: 'login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  constructor(public auth: AngularFireAuth, public router: Router) {}

  login() {
    this.auth
      .signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then((data) => {
        if (data.user?.email) {
          this.router.navigate(['/dashboard']);
        }
      })
      .catch(() => {});
  }

  logout() {
    this.auth.signOut();
  }
}
