import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.get<Artist>(`${this.apiUrl}/${id}`);
  }

  createArtist(data: Partial<Artist>): Observable<Artist> {
    return this.http.post<Artist>(this.apiUrl, data);
  }

  updateArtist(id: string, data: Partial<Artist>): Observable<Artist> {
    return this.http.put<Artist>(`${this.apiUrl}/${id}`, data);
  }

  deleteArtist(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
