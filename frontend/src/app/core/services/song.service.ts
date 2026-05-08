import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Song, PaginatedResponse, SongQueryParams, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class SongService {
  private readonly apiUrl = `${environment.apiUrl}/songs`;

  constructor(private http: HttpClient) { }

  getSongs(params: SongQueryParams = {}): Observable<PaginatedResponse<Song>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, String(val));
      }
    });
    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(res => ({
        data: res.data?.songs || [],
        total: res.pagination?.total || 0,
        page: res.pagination?.page || 1,
        limit: res.pagination?.limit || 20,
        totalPages: res.pagination?.pages || 1
      }))
    );
  }

  getSong(id: string): Observable<Song> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data?.song ?? res)
    );
  }

  searchSongs(query: string, params: SongQueryParams = {}): Observable<PaginatedResponse<Song>> {
    return this.getSongs({ ...params, search: query });
  }

  getTrending(limit = 10): Observable<PaginatedResponse<Song>> {
    return this.getSongs({ sort: '-downloadCount', limit });
  }

  getFeatured(limit = 6): Observable<PaginatedResponse<Song>> {
    return this.getSongs({ featured: true, limit });
  }

  downloadSong(id: string): Observable<{ downloadUrl: string }> {
    return this.http.get<{ downloadUrl: string }>(`${this.apiUrl}/${id}/download`);
  }

  createSong(data: FormData): Observable<Song> {
    return this.http.post<Song>(this.apiUrl, data);
  }

  updateSong(id: string, data: FormData | Partial<Song>): Observable<Song> {
    return this.http.put<Song>(`${this.apiUrl}/${id}`, data);
  }

  deleteSong(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
