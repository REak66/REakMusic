import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard for the admin root (/admin) route.
 * - Admins: pass through to AdminDashboardComponent
 * - Producers: redirect to /admin/songs (their default landing page)
 */
@Injectable({ providedIn: 'root' })
export class ProducerRedirectGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isProducer()) {
      return this.router.createUrlTree(['/admin/songs']);
    }
    return true;
  }
}
