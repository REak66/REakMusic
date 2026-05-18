import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Subscription } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(22px)' }),
        animate('450ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('tableEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('400ms 60ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class OrderManagementComponent implements OnInit {
  subscriptions: Subscription[] = [];
  filteredSubscriptions: Subscription[] = [];
  loading = true;
  statusFilter = 'all';
  page = 1;
  pageSize = 10;
  actionInProgress: string | null = null;

  get pagedSubscriptions(): Subscription[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredSubscriptions.slice(start, start + this.pageSize);
  }

  constructor(private subscriptionService: SubscriptionService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.subscriptionService.listAll().subscribe({
      next: data => {
        this.subscriptions = data.subscriptions ?? [];
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  filter(status: string): void {
    this.statusFilter = status;
    this.page = 1;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  private applyFilter(): void {
    this.filteredSubscriptions = this.statusFilter === 'all'
      ? this.subscriptions
      : this.subscriptions.filter(s => s.status === this.statusFilter);
  }

  approve(id: string): void {
    this.actionInProgress = id;
    this.subscriptionService.approve(id).subscribe({
      next: updated => {
        this.updateLocal(updated);
        this.actionInProgress = null;
        this.cdr.markForCheck();
      },
      error: () => { this.actionInProgress = null; this.cdr.markForCheck(); }
    });
  }

  reject(id: string): void {
    this.actionInProgress = id;
    this.subscriptionService.reject(id).subscribe({
      next: updated => {
        this.updateLocal(updated);
        this.actionInProgress = null;
        this.cdr.markForCheck();
      },
      error: () => { this.actionInProgress = null; this.cdr.markForCheck(); }
    });
  }

  private updateLocal(updated: Subscription): void {
    const idx = this.subscriptions.findIndex(s => s._id === updated._id);
    if (idx > -1) this.subscriptions[idx] = updated;
    this.applyFilter();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.cdr.markForCheck();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.cdr.markForCheck();
  }
}

