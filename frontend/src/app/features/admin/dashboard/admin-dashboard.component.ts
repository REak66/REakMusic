import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  analytics: Analytics | null = null;
  loading = true;

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.userService.getAnalytics().subscribe({
      next: data => {
        this.analytics = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }
}
