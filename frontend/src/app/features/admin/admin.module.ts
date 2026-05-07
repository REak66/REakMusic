import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { SongManagementComponent } from './songs/song-management.component';
import { ArtistManagementComponent } from './artists/artist-management.component';
import { OrderManagementComponent } from './orders/order-management.component';
import { UserManagementComponent } from './users/user-management.component';

@NgModule({
  declarations: [
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
    AdminRoutingModule
  ]
})
export class AdminModule {}
