import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Genre, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class GenreService {
  private readonly apiUrl = `${environment.apiUrl}/genres`;

  constructor(private http: HttpClient) { }

  getGenres(): Observable<Genre[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.data?.genres || [])
    );
  }

  getGenre(slug: string): Observable<Genre> {
    return this.http.get<Genre>(`${this.apiUrl}/${slug}`);
  }

  createGenre(data: Partial<Genre>): Observable<Genre> {
    return this.http.post<Genre>(this.apiUrl, data);
  }

  updateGenre(id: string, data: Partial<Genre>): Observable<Genre> {
    return this.http.put<Genre>(`${this.apiUrl}/${id}`, data);
  }

  deleteGenre(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
