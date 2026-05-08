import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { SelectDropdownComponent } from './components/select-dropdown/select-dropdown.component';
import { ImageCropperComponent } from './components/image-cropper/image-cropper.component';

@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
    SelectDropdownComponent,
    ImageCropperComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule
  ],
  exports: [
    NavbarComponent,
    FooterComponent,
    SelectDropdownComponent,
    ImageCropperComponent,
    CommonModule,
    RouterModule,
    TranslateModule
  ]
})
export class SharedModule { }
