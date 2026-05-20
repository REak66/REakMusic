import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard that restricts access to admin users only (excludes producers)
 * Used for admin-only features like Genre Management
 */
@Injectable({ providedIn: 'root' })
export class AdminOnlyGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(): boolean | UrlTree {
        if (this.authService.isAdmin()) {
            return true;
        }
        // Redirect non-admin users back to admin home
        return this.router.createUrlTree(['/admin']);
    }
}
