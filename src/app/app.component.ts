import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

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

  constructor(public authService: AuthService, public router: Router) {}
}
