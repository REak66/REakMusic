import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Subscription } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent implements OnInit {
  subscription: Subscription | null = null;
  loading = true;
  cancelling = false;

  get daysRemaining(): number {
    if (!this.subscription?.endDate) return 0;
    const diff = new Date(this.subscription.endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  get totalDays(): number {
    return this.subscription?.plan === 'monthly' ? 30 : 7;
  }

  get progressPct(): number {
    if (!this.subscription?.startDate || !this.subscription?.endDate) return 0;
    const total = new Date(this.subscription.endDate).getTime() - new Date(this.subscription.startDate).getTime();
    const elapsed = Date.now() - new Date(this.subscription.startDate).getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  get daysSinceStart(): number {
    if (!this.subscription?.startDate) return 0;
    return Math.floor((Date.now() - new Date(this.subscription.startDate).getTime()) / (1000 * 60 * 60 * 24));
  }

  /** Pending subs can always be cancelled; active only within 7 days of activation */
  get canCancel(): boolean {
    if (!this.subscription) return false;
    if (this.subscription.status === 'pending') return true;
    return this.daysSinceStart <= 7;
  }

  /** Renew is available when active and within 7 days of expiry */
  get canRenew(): boolean {
    return this.subscription?.status === 'active' && this.daysRemaining <= 7;
  }

  get daysUntilRenewWindow(): number {
    return Math.max(0, this.daysRemaining - 7);
  }

  constructor(private subscriptionService: SubscriptionService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.subscriptionService.getMySubscription().subscribe({
      next: sub => {
        this.subscription = sub;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  cancel(): void {
    this.cancelling = true;
    this.subscriptionService.cancelSubscription().subscribe({
      next: () => {
        this.subscription = null;
        this.cancelling = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cancelling = false; this.cdr.markForCheck(); }
    });
  }
}

