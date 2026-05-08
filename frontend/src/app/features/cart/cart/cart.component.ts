import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent {
  cart$ = this.cartService.cart$;

  constructor(public cartService: CartService, private router: Router) {}

  remove(songId: string): void {
    this.cartService.removeFromCart(songId);
  }

  checkout(): void {
    this.router.navigate(['/cart/checkout']);
  }

  trackById(_: number, item: CartItem): string {
    return item.song._id;
  }
}
