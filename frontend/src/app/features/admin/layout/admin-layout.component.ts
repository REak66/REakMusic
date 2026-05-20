import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    standalone: false,
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
    sidebarOpen = false;

    constructor(public authService: AuthService) { }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }
}
