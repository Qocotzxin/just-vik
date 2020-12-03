import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  links = [
    {
      path: '/products',
      icon: 'category',
      name: 'Productos',
    },
    {
      path: '/sales',
      icon: 'point_of_sale',
      name: 'Ventas',
    },
    {
      path: '/balance',
      icon: 'trending_up',
      name: 'Balance',
    },
  ];

  constructor(
    public auth: AngularFireAuth,
    public router: Router,
    private _snackBar: MatSnackBar
  ) {}

  logout() {
    this.auth
      .signOut()
      .then(() => this.router.navigate(['/']))
      .catch(() => this._snackBar.open('No se pudo desloguear.', 'CERRAR'));
  }
}
