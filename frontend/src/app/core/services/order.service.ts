import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { map, switchMap, takeWhile } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Order } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private readonly userOrdersUrl = `${environment.apiUrl}/users/me/orders`;

  constructor(private http: HttpClient) { }

  private mapOrder(raw: any): Order {
    return { ...raw, total: raw.totalPrice ?? raw.total };
  }

  checkout(songIds: string[]): Observable<Order> {
    return this.http.post<any>(`${this.apiUrl}/checkout`, { songIds }).pipe(
      map(res => this.mapOrder(res.data?.order ?? res))
    );
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<any>(this.userOrdersUrl).pipe(
      map(res => (res.data?.orders ?? res).map((o: any) => this.mapOrder(o)))
    );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => this.mapOrder(res.data?.order ?? res))
    );
  }

  pollOrderStatus(id: string): Observable<Order> {
    return interval(5000).pipe(
      switchMap(() => this.getOrder(id)),
      takeWhile(order => order.status === 'pending', true)
    );
  }
}
