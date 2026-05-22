import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private cachedToken: string | null = null;

  constructor(private authService: AuthService) {
    // Keep cachedToken in sync with login/logout events reactively
    this.authService.currentUser$.subscribe(() => {
      this.cachedToken = localStorage.getItem('token');
    });
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let authReq = req;
    
    if (!this.cachedToken) {
      this.cachedToken = localStorage.getItem('token');
    }
    
    const token = this.cachedToken;
    if (token) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/auth/login')) {
          this.authService.clearSession();
        }
        return throwError(() => error);
      })
    );
  }
}
