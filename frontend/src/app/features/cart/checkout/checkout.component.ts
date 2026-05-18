import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Subscription } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnInit {
  subscription: Subscription | null = null;
  loading = true;

  constructor(
    private subscriptionService: SubscriptionService,
    private cdr: ChangeDetectorRef
  ) { }

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
}

