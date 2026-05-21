import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean {
    const authenticated = this.authService.isAuthenticated();
    const validToken = this.authService.hasValidToken();

    if (authenticated || validToken) {
      return true;
    }

    this.router.navigate(['/auth/login']);
    return false;
  }
}
