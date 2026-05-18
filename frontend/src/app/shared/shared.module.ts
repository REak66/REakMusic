import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ScrollTopModule } from 'primeng/scrolltop';
import { ConfirmationService } from 'primeng/api';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ScrollTopComponent } from './components/scroll-top/scroll-top.component';
import { FooterComponent } from './components/footer/footer.component';
import { SelectDropdownComponent } from './components/select-dropdown/select-dropdown.component';
import { ImageCropperComponent } from './components/image-cropper/image-cropper.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AnimateOnScrollComponent } from './components/animate-on-scroll/animate-on-scroll.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { SkeletonComponent } from './components/skeleton/skeleton.component';

@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
    SelectDropdownComponent,
    ImageCropperComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    AnimateOnScrollComponent,
    ProgressBarComponent,
    SkeletonComponent,
    ScrollTopComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    PaginatorModule,
    ConfirmDialogModule,
    AnimateOnScrollModule,
    ProgressBarModule,
    SkeletonModule,
    ScrollTopModule
  ],
  exports: [
    NavbarComponent,
    FooterComponent,
    SelectDropdownComponent,
    ImageCropperComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    AnimateOnScrollComponent,
    ProgressBarComponent,
    SkeletonComponent,
    ScrollTopComponent,
    CommonModule,
    RouterModule,
    TranslateModule,
    ConfirmDialogModule,
    AnimateOnScrollModule,
    ProgressBarModule,
    SkeletonModule,
    ScrollTopModule
  ],
  providers: [
    ConfirmationService
  ]
})
export class SharedModule { }
