import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Subscription } from '../models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
    private readonly apiUrl = `${environment.apiUrl}/subscriptions`;

    constructor(private http: HttpClient) { }

    subscribe(plan: 'weekly' | 'monthly'): Observable<Subscription> {
        return this.http.post<any>(this.apiUrl, { plan }).pipe(
            map(res => res.data?.subscription ?? res)
        );
    }

    getMySubscription(): Observable<Subscription | null> {
        return this.http.get<any>(`${this.apiUrl}/me`).pipe(
            map(res => res.data?.subscription ?? null)
        );
    }

    cancelSubscription(): Observable<Subscription> {
        return this.http.delete<any>(`${this.apiUrl}/me`).pipe(
            map(res => res.data?.subscription ?? res)
        );
    }

    listAll(page = 1, limit = 20): Observable<{ subscriptions: Subscription[]; total: number }> {
        return this.http.get<any>(`${this.apiUrl}?page=${page}&limit=${limit}`).pipe(
            map(res => res.data ?? res)
        );
    }

    approve(id: string): Observable<Subscription> {
        return this.http.patch<any>(`${this.apiUrl}/${id}/approve`, {}).pipe(
            map(res => res.data?.subscription ?? res)
        );
    }

    reject(id: string): Observable<Subscription> {
        return this.http.patch<any>(`${this.apiUrl}/${id}/reject`, {}).pipe(
            map(res => res.data?.subscription ?? res)
        );
    }
}
