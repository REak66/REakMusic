import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { UserService } from '../../../core/services/user.service';

@Component({
  standalone: false,
  selector: 'app-download-history',
  templateUrl: './download-history.component.html',
  styleUrls: ['./download-history.component.scss'],
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
export class DownloadHistoryComponent implements OnInit {
  downloads: any[] = [];
  filteredDownloads: any[] = [];
  loading = true;
  page = 1;
  pageSize = 10;
  total = 0;
  searchQuery = '';
  dateRange: Date[] = [];

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.userService.getDownloadHistory(this.page, this.pageSize).subscribe({
      next: res => {
        this.downloads = res.data || [];
        this.total = res.total || 0;
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyFilter(): void {
    let result = this.downloads;

    // Filter by query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(d => 
        d.songId?.title?.toLowerCase().includes(q) ||
        d.userId?.fullName?.toLowerCase().includes(q) ||
        d.userId?.email?.toLowerCase().includes(q) ||
        d.ip?.includes(q)
      );
    }

    // Filter by date range (DatePicker select from date to date range)
    if (this.dateRange && this.dateRange.length > 0 && this.dateRange[0]) {
      const start = new Date(this.dateRange[0]);
      start.setHours(0, 0, 0, 0);

      const end = this.dateRange[1] ? new Date(this.dateRange[1]) : new Date(this.dateRange[0]);
      end.setHours(23, 59, 59, 999);

      result = result.filter(d => {
        if (!d.createdAt) return false;
        const cDate = new Date(d.createdAt);
        return cDate >= start && cDate <= end;
      });
    }

    this.filteredDownloads = result;
  }

  clearDateRange(): void {
    this.dateRange = [];
    this.applyFilter();
  }

  onSearch(): void {
    this.applyFilter();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadData();
  }
}
