import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Artist, ApiResponse, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  private readonly apiUrl = `${environment.apiUrl}/artists`;

  constructor(private http: HttpClient) {}

  getArtists(params: { page?: number; limit?: number; search?: string } = {}): Observable<PaginatedResponse<Artist>> {
    return this.http.get<PaginatedResponse<Artist>>(this.apiUrl, { params: params as Record<string, string> });
  }

  getArtist(id: string): Observable<Artist> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data?.artist ?? res)
    );
  }

  createArtist(data: Partial<Artist>): Observable<Artist> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map(res => res.data?.artist ?? res)
    );
  }

  updateArtist(id: string, data: Partial<Artist>): Observable<Artist> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      map(res => res.data?.artist ?? res)
    );
  }

  deleteArtist(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
