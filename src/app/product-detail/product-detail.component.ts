import { Component, OnInit, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../_models/product';
import { ProductService } from '../_services/product.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { finalize, tap, map } from 'rxjs/operators/';
import { SettingsService } from '../_services/settings.service';
import { Settings } from '../_models/settings';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {

  product: Product;
  settings: Settings;

  constructor(
    private productService: ProductService,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private location: Location,
    @Inject('BaseURL') public BaseURL
  ) { }

  ngOnInit() {
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

}
