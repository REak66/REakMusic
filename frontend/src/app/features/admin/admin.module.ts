import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { SongManagementComponent } from './songs/song-management.component';
import { ArtistManagementComponent } from './artists/artist-management.component';
import { OrderManagementComponent } from './orders/order-management.component';
import { UserManagementComponent } from './users/user-management.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminDashboardComponent,
    SongManagementComponent,
    ArtistManagementComponent,
    OrderManagementComponent,
    UserManagementComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    AdminRoutingModule,
    SharedModule
  ]
})
export class AdminModule { }
