import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Album, ApiResponse, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AlbumService {
  private readonly apiUrl = `${environment.apiUrl}/albums`;

  constructor(private http: HttpClient) {}

  getAlbums(params: { page?: number; limit?: number; artistId?: string } = {}): Observable<PaginatedResponse<Album>> {
    return this.http.get<PaginatedResponse<Album>>(this.apiUrl, { params: params as Record<string, string> });
  }

  getAlbum(id: string): Observable<Album> {
    return this.http.get<Album>(`${this.apiUrl}/${id}`);
  }

  createAlbum(data: Partial<Album>): Observable<Album> {
    return this.http.post<Album>(this.apiUrl, data);
  }

  updateAlbum(id: string, data: Partial<Album>): Observable<Album> {
    return this.http.put<Album>(`${this.apiUrl}/${id}`, data);
  }

  deleteAlbum(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
