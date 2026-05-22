import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CachedResponse {
  response: HttpResponse<any>;
  expiresAt: number;
}

@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CachedResponse>();
  private readonly CACHE_TTL_MS = 10 * 1000; // 10 seconds in-memory cache for GETs

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // Do NOT cache streaming, downloading, or auth state requests
    const bypassUrls = ['/stream', '/download', '/auth/me', '/auth/login', '/resolve-drive'];
    if (bypassUrls.some(path => req.url.includes(path))) {
      return next.handle(req);
    }

    const cacheKey = req.urlWithParams;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now < cached.expiresAt) {
      // Return cached response directly
      return of(cached.response.clone());
    }

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(cacheKey, {
            response: event,
            expiresAt: Date.now() + this.CACHE_TTL_MS
          });
        }
      })
    );
  }
}
