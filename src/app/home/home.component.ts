import { Component, OnInit, Inject } from '@angular/core';
import { ContentService } from '../_services/content.service';
import { ProductService } from '../_services/product.service';
import { Content } from '../_models/content';
import { Product } from '../_models/product';
import { baseURL } from '../_helpers/baseurl';
import { DomSanitizer } from '@angular/platform-browser';
import { map, filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  content: Content;
  bestsellers: Product[];

  constructor(
    private contentService: ContentService,
    private productService: ProductService,
    public sanitizer: DomSanitizer,
    @Inject('BaseURL') public BaseURL
  ) { }

  ngOnInit() {
    this.getContent();
    this.getBestsellers();
  }

  getBestsellers() {
    console.log('getbestsellers');
    this.productService.getProducts()
      .pipe(
        map((products) => {
          return products.filter(product => product.isBestseller);
        }
      )).subscribe(
        bestsellers => {
          this.bestsellers = bestsellers;
        }
      );
  }

  getPrimaryPhoto(product: Product) {
    for (let image of product.images) {
      if (image.isPrimary) {
        return image.url;
      }
    }
    return product.images[0].url;
  }

  getContent() {
    this.contentService.getContent()
      .subscribe(
        content => {
          this.content = content[0];
        }
      );
  }
}
