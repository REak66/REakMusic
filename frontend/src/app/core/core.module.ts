import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';
import { KhmerLangDirective } from './directives/khmer-lang.directive';

@NgModule({
  imports: [CommonModule, KhmerLangDirective],
  exports: [KhmerLangDirective],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCacheInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class CoreModule { }
