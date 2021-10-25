import { Component, OnInit, Inject } from '@angular/core';
import { Product } from '../_models/product';
import { OrderItem } from '../_models/order';
import { ProductService } from '../_services/product.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { finalize, tap, map } from 'rxjs/operators/';
import { SettingsService } from '../_services/settings.service';
import { Settings } from '../_models/settings';
import { AppComponent } from 'app/app.component';
import { Router, NavigationEnd, Event } from '@angular/router';

@Component({
  providers: [AppComponent],
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {

  product: Product;
  settings: Settings;
  noOfItemsCart = 1;
  selectedProductCount = 1;

  constructor(
    private router: Router,
    private productService: ProductService,
    private settingsService: SettingsService,
    private appComponent: AppComponent,
    private route: ActivatedRoute,
    private location: Location,
    @Inject('BaseURL') public BaseURL
  ) { }

  ngOnInit() {
    this.router.events.subscribe(
      (event: Event) => {
        if (event instanceof NavigationEnd) {
          this.getProductDetails();
        }
      }
    );
    this.getProductDetails();
  }

  getProductDetails() {
    const id = this.route.snapshot.paramMap.get('id');
    this.productService.getProductById(id)
      .pipe(map(product => {
        this.product = product;
      }))
      .subscribe();
  }

  getSettings(): void {
    this.settingsService.getSettings()
      .pipe(tap(settings => {
        this.settings = settings;
      }))
      .subscribe();
  }

  addToCart() {
    this.selectedProductCount = this.noOfItemsCart;

    const orderItem: OrderItem = {
      product: this.product._id,
      quantity: this.noOfItemsCart
    };
    if (localStorage.getItem('cart') === null) {
      const cart: any = [];
      cart.push(JSON.stringify(orderItem));
      localStorage.setItem('cart', JSON.stringify(cart));
    } else {
      let cart: any = localStorage.getItem('cart');
      if (cart) {
        cart = JSON.parse(cart);
      } else {
        return;
      }
      let index = -1;
      for (let i = 0; i < cart.length; i++) {
        const item: OrderItem = JSON.parse(cart[i]);
        if (item.product === this.product._id) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        cart.push(JSON.stringify(orderItem));
        localStorage.setItem('cart', JSON.stringify(cart));
      } else {
        const item: OrderItem = JSON.parse(cart[index]);
        item.quantity += this.noOfItemsCart;
        cart[index] = JSON.stringify(item);
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    }

    $('#addToCartModal').hide();
    $('.modal-backdrop').remove();
    this.noOfItemsCart = 1;
    this.appComponent.loadCart();
    this.appComponent.showJustAddedModal(this.product, this.selectedProductCount);
  }

}
