import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ScrollTopModule } from 'primeng/scrolltop';
import { ConfirmationService, MessageService } from 'primeng/api';

// 8 PrimeNG requested modules
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TreeSelectModule } from 'primeng/treeselect';
import { DialogModule } from 'primeng/dialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ToastModule } from 'primeng/toast';
import { MeterGroupModule } from 'primeng/metergroup';
import { ColorPickerModule } from 'primeng/colorpicker';

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
import { ComboBoxComponent } from './components/combo-box/combo-box.component';

@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
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
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    PaginatorModule,
    ConfirmDialogModule,
    AnimateOnScrollModule,
    ProgressBarModule,
    SkeletonModule,
    ScrollTopModule,
    DatePickerModule,
    SelectModule,
    TreeSelectModule,
    DialogModule,
    BreadcrumbModule,
    ToastModule,
    MeterGroupModule,
    ColorPickerModule,
    ComboBoxComponent,
    SelectDropdownComponent
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
    ComboBoxComponent,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    ConfirmDialogModule,
    AnimateOnScrollModule,
    ProgressBarModule,
    SkeletonModule,
    ScrollTopModule,
    DatePickerModule,
    SelectModule,
    TreeSelectModule,
    DialogModule,
    BreadcrumbModule,
    ToastModule,
    MeterGroupModule,
    ColorPickerModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ]
})
export class SharedModule { }

