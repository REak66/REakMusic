import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser$!: Observable<User | null>;
  menuOpen = false;
  private routerSub?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.menuOpen = false;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  logout(): void {
    this.authService.logout();
    this.menuOpen = false;
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
