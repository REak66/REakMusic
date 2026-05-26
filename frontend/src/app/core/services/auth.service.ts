import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, RegisterRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly LOGIN_TIMESTAMP_KEY = 'loginTimestamp';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null;

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  ngOnDestroy(): void {
    this.stopSessionTimer();
  }

  /** Called by APP_INITIALIZER to restore session on page load. */
  tryRefreshOnInit(): Observable<unknown> {
    const token = localStorage.getItem('token');
    if (!token) return of(null);

    // Keep the session alive until the JWT actually expires.
    const expired = this.isSessionExpired();
    if (expired) {
      this.clearSession('auth.sessionExpired');
      return of(null);
    }

    this.restoreSessionFromToken();
    this.setLoginTimestampIfMissing();
    this.startSessionTimer();

    // Refresh the user profile and block bootstrapping until it completes.
    return this.http.get<{ data: { user: User } }>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        if (res?.data?.user) {
          this.currentUserSubject.next(res.data.user);
        }
      }),
      catchError((error) => {
        if (error?.status === 401 || error?.status === 403) {
          this.clearSession('auth.sessionExpired');
        }
        return of(null);
      }),
      map(() => null)
    );
  }

  login(email: string, password: string): Observable<{ user: User }> {
    return this.http.post<{ data: { token: string; user: User } }>(
      `${this.apiUrl}/login`,
      { email, password }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.data.token);
        this.setLoginTimestamp();
        this.currentUserSubject.next(res.data.user);
        this.startSessionTimer();
      }),
      map(res => res.data)
    );
  }

  register(data: RegisterRequest): Observable<unknown> {
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
    this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      catchError(() => of(null))
    ).subscribe();
    this.clearSession();
  }

  clearSession(messageKey?: string): void {
    localStorage.removeItem('token');
    localStorage.removeItem(this.LOGIN_TIMESTAMP_KEY);
    this.stopSessionTimer();
    this.currentUserSubject.next(null);
    const queryParams = messageKey ? { messageKey } : {};
    // Use setTimeout to defer navigation to the next macrotask tick.
    // This prevents Angular bootstrapping crashes during APP_INITIALIZER if clearSession is called on startup.
    setTimeout(() => {
      this.router.navigate(['/auth/login'], { queryParams }).catch(err => {
        console.error('Navigation to login failed:', err);
      });
    });
  }

  /** Returns true if the login session has exceeded the JWT expiry or fallback login timeout. */
  private isSessionExpired(): boolean {
    const tokenExpiryMs = this.getTokenExpiryMs();
    if (tokenExpiryMs !== null) {
      return Date.now() >= tokenExpiryMs;
    }

    const timestamp = localStorage.getItem(this.LOGIN_TIMESTAMP_KEY);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp, 10) >= this.SESSION_DURATION_MS;
  }

  private getTokenExpiryMs(): number | null {
    const payload = this.getTokenPayload();
    if (!payload?.exp) return null;
    return payload.exp * 1000;
  }

  private getTokenPayload(): { id?: string; email?: string; role?: string; exp?: number } | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const decoded = atob(base64);
      const json = decodeURIComponent(
        decoded
          .split('')
          .map(ch => '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private restoreSessionFromToken(): void {
    const payload = this.getTokenPayload();
    if (!payload?.id || !payload?.email || !payload?.role) return;
    if (this.currentUserSubject.value) return;

    this.currentUserSubject.next({
      _id: payload.id,
      fullName: '',
      email: payload.email,
      role: payload.role as User['role'],
      isVerified: false,
      purchasedSongs: [],
      createdAt: '',
      updatedAt: ''
    } as User);
  }

  private setLoginTimestamp(): void {
    localStorage.setItem(this.LOGIN_TIMESTAMP_KEY, Date.now().toString());
  }

  private setLoginTimestampIfMissing(): void {
    if (!localStorage.getItem(this.LOGIN_TIMESTAMP_KEY)) {
      this.setLoginTimestamp();
    }
  }

  /** Starts a periodic check (every 60s) to auto-logout on session expiry. */
  private startSessionTimer(): void {
    this.stopSessionTimer();
    this.sessionCheckInterval = setInterval(() => {
      if (this.isSessionExpired()) {
        this.clearSession('auth.sessionExpired');
      }
    }, 60 * 1000); // check every 60 seconds
  }

  /** Clears the periodic session check timer. */
  private stopSessionTimer(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  isAuthenticated(): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    // An explicitly marked guest user is not fully authenticated for membership actions
    return user.role !== 'guest' && user.role !== 'guest_user';
  }

  hasValidToken(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    const valid = !this.isSessionExpired();
    if (valid && !this.currentUserSubject.value) {
      this.restoreSessionFromToken();
    }
    return valid;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  isProducer(): boolean {
    return this.currentUserSubject.value?.role === 'producer';
  }

  isGuest(): boolean {
    const role = this.currentUserSubject.value?.role;
    return !this.currentUserSubject.value || role === 'guest' || role === 'guest_user';
  }

  isMusicManager(): boolean {
    const role = this.currentUserSubject.value?.role;
    return role === 'admin' || role === 'producer';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasPurchased(songId: string): boolean {
    return this.currentUserSubject.value?.purchasedSongs?.includes(songId) ?? false;
  }
}
