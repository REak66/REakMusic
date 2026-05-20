import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Song, CartItem } from '../models';

const CART_KEY = 'reakmusic_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartSubject = new BehaviorSubject<CartItem[]>(this.loadCart());

  cart$ = this.cartSubject.asObservable();

  private loadCart(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveCart(items: CartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    this.cartSubject.next(items);
  }

  getCart(): CartItem[] {
    return this.cartSubject.value;
  }

  isInCart(songId: string): boolean {
    return this.cartSubject.value.some(item => item.song._id === songId);
  }

  addToCart(song: Song): void {
    if (this.isInCart(song._id)) return;
    const items = [...this.cartSubject.value, { song, addedAt: Date.now() }];
    this.saveCart(items);
  }

  removeFromCart(songId: string): void {
    const items = this.cartSubject.value.filter(item => item.song._id !== songId);
    this.saveCart(items);
  }

  clearCart(): void {
    this.saveCart([]);
  }

  getTotal(): number {
    return this.cartSubject.value.reduce((sum, item) => sum + (item.song.price || 0), 0);
  }

  getCount(): number {
    return this.cartSubject.value.length;
  }
}
