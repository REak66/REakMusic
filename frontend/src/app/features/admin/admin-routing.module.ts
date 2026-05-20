import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { SongManagementComponent } from './songs/song-management.component';
import { ArtistManagementComponent } from './artists/artist-management.component';
import { OrderManagementComponent } from './orders/order-management.component';
import { UserManagementComponent } from './users/user-management.component';
import { DownloadHistoryComponent } from './download-history/download-history.component';
import { GenreManagementComponent } from './genres/genre-management.component';
import { ProducerRedirectGuard } from '../../core/guards/producer-redirect.guard';
import { AdminOnlyGuard } from '../../core/guards/admin-only.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent, canActivate: [ProducerRedirectGuard] },
      { path: 'songs', component: SongManagementComponent },
      { path: 'genres', component: GenreManagementComponent, canActivate: [AdminOnlyGuard] },
      { path: 'download-history', component: DownloadHistoryComponent },
      { path: 'artists', component: ArtistManagementComponent },
      { path: 'subscriptions', component: OrderManagementComponent },
      { path: 'users', component: UserManagementComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
