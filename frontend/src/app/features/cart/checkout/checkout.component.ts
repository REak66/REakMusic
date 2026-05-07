import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  loading = true;
  error = '';
  private pollSub?: Subscription;

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const songIds = this.cartService.getCart().map(item => item.song._id);
    if (songIds.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.orderService.checkout(songIds).subscribe({
      next: order => {
        this.order = order;
        this.loading = false;
        this.cdr.markForCheck();
        this.startPolling(order._id);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Failed to create order.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  startPolling(orderId: string): void {
    this.pollSub = this.orderService.pollOrderStatus(orderId).subscribe({
      next: order => {
        this.order = order;
        this.cdr.markForCheck();
        if (order.status === 'paid') {
          this.cartService.clearCart();
          this.pollSub?.unsubscribe();
        }
        if (order.status === 'expired') {
          this.pollSub?.unsubscribe();
        }
      }
    });
  }

  get timeLeft(): string {
    if (!this.order?.expiresAt) return '';
    const diff = Math.max(0, new Date(this.order.expiresAt).getTime() - Date.now());
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
