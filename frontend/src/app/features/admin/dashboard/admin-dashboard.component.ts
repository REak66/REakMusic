import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { UserService } from '../../../core/services/user.service';

interface Analytics {
  totalRevenue: number;
  totalUsers: number;
  totalSongs: number;
  totalDownloads: number;
  topSongs: Array<{ title: string; downloadCount: number }>;
}

@Component({
  standalone: false,
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(22px)' }),
        animate('450ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-22px)' }),
        animate('500ms 120ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('slideRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(22px)' }),
        animate('500ms 120ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  analytics: Analytics | null = null;
  loading = true;

  animatedRevenue = 0;
  animatedUsers = 0;
  animatedSongs = 0;
  animatedDownloads = 0;

  private rafIds: number[] = [];

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.userService.getAnalytics().subscribe({
      next: data => {
        this.analytics = data;
        this.loading = false;
        this.cdr.markForCheck();
        this.startCounters(data);
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  ngOnDestroy(): void {
    this.rafIds.forEach(id => cancelAnimationFrame(id));
  }

  private startCounters(data: Analytics): void {
    this.animateNumber('animatedRevenue', data.totalRevenue, 1400);
    this.animateNumber('animatedUsers', data.totalUsers, 1200);
    this.animateNumber('animatedSongs', data.totalSongs, 1000);
    this.animateNumber('animatedDownloads', data.totalDownloads, 1100);
  }

  private animateNumber(
    prop: 'animatedRevenue' | 'animatedUsers' | 'animatedSongs' | 'animatedDownloads',
    target: number,
    duration: number
  ): void {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this[prop] = target * eased;
      this.cdr.markForCheck();
      if (progress < 1) {
        this.rafIds.push(requestAnimationFrame(tick));
      }
    };
    this.rafIds.push(requestAnimationFrame(tick));
  }
}
