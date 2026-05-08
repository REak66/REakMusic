import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getProfile(): Observable<User> {
    return this.http.get<{ data: { user: User } }>(`${this.apiUrl}/me`).pipe(
      map(res => res.data.user)
    );
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.patch<{ data: { user: User } }>(`${this.apiUrl}/me`, data).pipe(
      map(res => res.data.user)
    );
  }

  getUsers(params: { page?: number; limit?: number } = {}): Observable<{ data: User[]; total: number }> {
    return this.http.get<{ data: { users: User[] }; pagination: { total: number } }>(this.apiUrl, { params: params as Record<string, string> }).pipe(
      map(res => ({ data: res.data.users, total: res.pagination?.total ?? 0 }))
    );
  }

  getAnalytics(): Observable<{
    totalRevenue: number;
    totalUsers: number;
    totalSongs: number;
    totalDownloads: number;
    topSongs: Array<{ title: string; downloadCount: number }>;
  }> {
    return this.http.get<{
      data: {
        totalRevenue: number;
        totalUsers: number;
        totalSongs: number;
        totalDownloads: number;
        topSongs: Array<{ title: string; downloadCount: number }>;
      }
    }>(`${environment.apiUrl}/analytics`).pipe(
      map(res => res.data)
    );
  }
}
