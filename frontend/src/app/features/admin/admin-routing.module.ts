import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { SongManagementComponent } from './songs/song-management.component';
import { ArtistManagementComponent } from './artists/artist-management.component';
import { OrderManagementComponent } from './orders/order-management.component';
import { UserManagementComponent } from './users/user-management.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'songs', component: SongManagementComponent },
      { path: 'artists', component: ArtistManagementComponent },
      { path: 'subscriptions', component: OrderManagementComponent },
      { path: 'users', component: UserManagementComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
