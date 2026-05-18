import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { ProfileComponent } from './profile/profile.component';
import { OrdersComponent } from './orders/orders.component';
import { LibraryComponent } from './library/library.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ProfileComponent,
    OrdersComponent,
    LibraryComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    DashboardRoutingModule,
    ImageCropperComponent,
    SharedModule
  ]
})
export class DashboardModule { }
