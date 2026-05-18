import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  /** Called by APP_INITIALIZER to restore session on page load. */
  tryRefreshOnInit(): Observable<unknown> {
    return this.http.get<{ data: { user: User } }>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap(res => this.currentUserSubject.next(res.data.user)),
      catchError(() => of(null))
    );
  }

  login(email: string, password: string): Observable<{ user: User }> {
    return this.http.post<{ data: { user: User } }>(
      `${this.apiUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap(res => this.currentUserSubject.next(res.data.user)),
      map(res => res.data)
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
    return this.http.post<{ data: { resetToken: string } }>(`${this.apiUrl}/verify-forgot-otp`, { email, otp }).pipe(
      map(res => res.data)
    );
  }

  resetPassword(token: string, newPassword: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/reset-password`, { resetToken: token, password: newPassword });
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null))
    ).subscribe();
    this.clearSession();
  }

  clearSession(): void {
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
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
