import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { User } from '../../core/models';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {
  currentUser$!: Observable<User | null>;
  menuOpen = false;

  constructor(
    public authService: AuthService,
    public cartService: CartService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
  }

  get cartCount(): number {
    return this.cartService.getCount();
  }

  logout(): void {
    this.authService.logout();
  }

  switchLang(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  get currentLang(): string {
    return this.translate.currentLang || 'en';
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
}
