import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Subscription } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent implements OnInit {
  currentSubscription: Subscription | null = null;
  loading = true;
  subscribing: 'weekly' | 'monthly' | null = null;
  error = '';

  get daysRemaining(): number {
    if (!this.currentSubscription?.endDate) return 0;
    const diff = new Date(this.currentSubscription.endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /** True when the active subscription is within the 7-day renewal window */
  get canRenew(): boolean {
    return this.currentSubscription?.status === 'active' && this.daysRemaining <= 7;
  }

  /** Days until the renewal window opens (0 when already open) */
  get daysUntilRenewWindow(): number {
    return Math.max(0, this.daysRemaining - 7);
  }

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.subscriptionService.getMySubscription().subscribe({
      next: sub => {
        this.currentSubscription = sub;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  subscribe(plan: 'weekly' | 'monthly'): void {
    this.subscribing = plan;
    this.error = '';
    this.subscriptionService.subscribe(plan).subscribe({
      next: () => {
        this.router.navigate(['/subscribe/confirm']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Failed to subscribe.';
        this.subscribing = null;
        this.cdr.markForCheck();
      }
    });
  }
}
