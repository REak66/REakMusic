import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Order } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  checkout(songIds: string[]): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/checkout`, { songIds });
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  pollOrderStatus(id: string): Observable<Order> {
    return interval(5000).pipe(
      switchMap(() => this.getOrder(id)),
      takeWhile(order => order.status === 'pending', true)
    );
  }
}
