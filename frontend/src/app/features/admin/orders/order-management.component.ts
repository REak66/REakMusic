import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderManagementComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  statusFilter = 'all';

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.filteredOrders = orders;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  filter(status: string): void {
    this.statusFilter = status;
    this.filteredOrders = status === 'all'
      ? this.orders
      : this.orders.filter(o => o.status === status);
    this.cdr.markForCheck();
  }
}
