import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/me`, data);
  }

  getUsers(params: { page?: number; limit?: number } = {}): Observable<{ data: User[]; total: number }> {
    return this.http.get<{ data: User[]; total: number }>(this.apiUrl, { params: params as Record<string, string> });
  }

  getAnalytics(): Observable<{
    totalRevenue: number;
    totalUsers: number;
    totalSongs: number;
    totalDownloads: number;
    topSongs: Array<{ title: string; downloadCount: number }>;
  }> {
    return this.http.get<{
      totalRevenue: number;
      totalUsers: number;
      totalSongs: number;
      totalDownloads: number;
      topSongs: Array<{ title: string; downloadCount: number }>;
    }>(`${environment.apiUrl}/analytics`);
  }
}
