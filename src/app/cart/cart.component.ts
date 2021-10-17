import { Component, OnInit } from '@angular/core';
import { OrderItem } from '../_models/order';
import { ProductService } from '../_services/product.service';
import { Router } from '@angular/router';
import { Product } from '../_models/product';
import { finalize, tap } from 'rxjs/operators';
import { Settings } from '../_models/settings';
import { SettingsService } from '../_services/settings.service';
import { AppComponent } from 'app/app.component';

@Component({
  providers: [AppComponent],
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  subTotal: number;
  orderItems: OrderItem[] = [];
  settings: Settings;
  selectedProduct: Product;

  constructor(
    private productService: ProductService,
    private settingsService: SettingsService,
    private appComponent: AppComponent,
    private router: Router
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
    let cart = localStorage.getItem('cart');

    if (cart) {
      cart = JSON.parse(cart);
    } else {
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
    this.appComponent.loadCart();
  }

  removeProduct() {
    if (this.selectedProduct === null) {
      return;
    }
    this.removeFromCart(this.selectedProduct._id);
    $('#removeProductModal').hide();
    $('.modal-backdrop').remove();
  }

  removeFromCart(id: string) {
    console.log('removeCart id: ', id);
    let cart: any = localStorage.getItem('cart');

    if (cart) {
      cart = JSON.parse(cart);
    } else {
      return;
    }
    
    const index = -1;
    for (let i = 0; i < cart.length; i++) {
      const item: OrderItem = JSON.parse(cart[i]);
      console.log(`Item ${i}: `, item);
      if (item.product === id) {
        console.log('Found it!');
        cart.splice(i, 1);
        break;
      }
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    this.loadCart();
  }

  selectProduct(product: Product) {
    this.selectedProduct = product;
  }

  proceedToCheckout() {
    // Reload cart
    const cart: any = [];
    for (let i = 0; i < this.orderItems.length; i++) {
      let item : OrderItem = {
        product: this.orderItems[i].product._id,
        quantity: this.orderItems[i].quantity
      };
      cart.push(JSON.stringify(item));
    }
    console.log('Cart: ', cart);
    localStorage.setItem('cart', JSON.stringify(cart));

    // Go to checkout page
    this.router.navigate(['/checkout'], { queryParams: { step: 'contact_information' } });
  }
}
