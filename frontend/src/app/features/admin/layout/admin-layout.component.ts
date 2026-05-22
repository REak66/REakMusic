import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    standalone: false,
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
    sidebarOpen = false;
    breadcrumbs: MenuItem[] = [];
    private routerSub?: Subscription;

    constructor(
        public authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.updateBreadcrumbs(this.router.url);
        this.routerSub = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: any) => {
                this.updateBreadcrumbs(event.urlAfterRedirects || event.url);
            });
    }

    ngOnDestroy(): void {
        if (this.routerSub) {
            this.routerSub.unsubscribe();
        }
    }

    private updateBreadcrumbs(url: string): void {
        const items: MenuItem[] = [{ label: 'Admin', routerLink: '/admin' }];

        if (url.includes('/songs')) {
            items.push({ label: 'Songs' });
        } else if (url.includes('/genres')) {
            items.push({ label: 'Genres' });
        } else if (url.includes('/download-history')) {
            items.push({ label: 'Download History' });
        } else if (url.includes('/artists')) {
            items.push({ label: 'Producers' });
        } else if (url.includes('/subscriptions')) {
            items.push({ label: 'Subscriptions' });
        } else if (url.includes('/users')) {
            items.push({ label: 'Users' });
        } else {
            items.push({ label: 'Dashboard' });
        }

        this.breadcrumbs = items;
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }
}

