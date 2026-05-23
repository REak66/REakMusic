import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { SongManagementComponent } from './songs/song-management.component';
import { SongImportComponent } from './songs/song-import/song-import.component';
import { ArtistManagementComponent } from './artists/artist-management.component';
import { OrderManagementComponent } from './orders/order-management.component';
import { UserManagementComponent } from './users/user-management.component';
import { DownloadHistoryComponent } from './download-history/download-history.component';
import { GenreManagementComponent } from './genres/genre-management.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminDashboardComponent,
    SongManagementComponent,
    SongImportComponent,
    ArtistManagementComponent,
    OrderManagementComponent,
    UserManagementComponent,
    DownloadHistoryComponent,
    GenreManagementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    AdminRoutingModule,
    SharedModule
  ]
})
export class AdminModule { }
