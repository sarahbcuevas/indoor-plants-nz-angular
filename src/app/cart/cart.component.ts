import { Component, OnInit } from '@angular/core';
import { OrderItem } from '../_models/order';
import { ProductService } from '../_services/product.service';
import { finalize, tap } from 'rxjs/operators';
import { Settings } from '../_models/settings';
import { SettingsService } from '../_services/settings.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  subTotal: number;
  orderItems: OrderItem[] = [];
  settings: Settings;

  constructor(
    private productService: ProductService,
    private settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.getSettings();
    this.loadCart();
  }

  getSettings(): void {
    this.settingsService.getSettings()
      .pipe(tap(settings => {
        this.settings = settings;
      }))
      .subscribe();
  }

  loadCart() {
    this.subTotal = 0;
    this.orderItems = [];
    const cart = JSON.parse(localStorage.getItem('cart'));

    if (cart === null) {
      return;
    }

    for (let i = 0; i < cart.length; i++) {
      const item = JSON.parse(cart[i]);
      this.productService.getProductById(item.product)
        .pipe()
        .subscribe(
          prod => {
            this.orderItems.push({
              product: prod,
              quantity: item.quantity
            });
            
            this.subTotal += prod.price * item.quantity;
          }
        );
    }
  }

}
