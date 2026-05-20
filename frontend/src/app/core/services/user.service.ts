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

  uploadAvatar(file: File): Observable<User> {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http.post<{ data: { user: User } }>(`${this.apiUrl}/me/avatar`, fd).pipe(
      map(res => res.data.user)
    );
  }

  createUser(payload: any): Observable<User> {
    return this.http.post<{ data: User }>(this.apiUrl, payload).pipe(
      map(res => res.data)
    );
  }

  updateUser(id: string, payload: any): Observable<User> {
    return this.http.patch<{ data: User }>(`${this.apiUrl}/${id}`, payload).pipe(
      map(res => res.data)
    );
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
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

  getDownloadHistory(page = 1, limit = 10): Observable<{ data: any[]; total: number }> {
    return this.http.get<any>(`${environment.apiUrl}/analytics/download-history`, {
      params: { page: String(page), limit: String(limit) }
    }).pipe(
      map(res => ({
        data: res.data?.downloads || [],
        total: res.pagination?.total ?? 0
      }))
    );
  }
}
