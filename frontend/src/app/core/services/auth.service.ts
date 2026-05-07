import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, AuthTokens } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private accessToken: string | null = null;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.tryRefreshOnInit();
  }

  private tryRefreshOnInit(): void {
    this.refreshToken().pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  login(email: string, password: string): Observable<{ accessToken: string; user: User }> {
    return this.http.post<{ accessToken: string; user: User }>(
      `${this.apiUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.accessToken = res.accessToken;
        this.currentUserSubject.next(res.user);
      })
    );
  }

  register(data: { fullName: string; email: string; password: string; phone?: string }): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  verifyOtp(email: string, otp: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp });
  }

  resendOtp(email: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/resend-otp`, { email });
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  verifyForgotOtp(email: string, otp: string): Observable<{ resetToken: string }> {
    return this.http.post<{ resetToken: string }>(`${this.apiUrl}/verify-forgot-otp`, { email, otp });
  }

  resetPassword(token: string, newPassword: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  refreshToken(): Observable<AuthTokens> {
    return this.http.post<{ accessToken: string; user: User }>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.accessToken = res.accessToken;
        this.currentUserSubject.next(res.user);
      }),
      map(res => ({ accessToken: res.accessToken })),
      catchError(err => {
        this.accessToken = null;
        this.currentUserSubject.next(null);
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null))
    ).subscribe();
    this.accessToken = null;
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasPurchased(songId: string): boolean {
    return this.currentUserSubject.value?.purchasedSongs?.includes(songId) ?? false;
  }
}
