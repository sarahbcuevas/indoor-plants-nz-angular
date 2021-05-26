import { Component, OnInit, Inject } from '@angular/core';
import { Category } from '../_models/category';
import { Contact } from '../_models/contact';
import { SocialMedia } from '../_models/socialmedia';
import { Product } from '../_models/product';
import { CategoryService } from '../_services/category.service';
import { ContactService } from '../_services/contact.service';
import { ProductService } from '../_services/product.service';
import { SocialmediaService } from '../_services/socialmedia.service';
import { Observable, of } from 'rxjs';
import { finalize, tap, map } from 'rxjs/operators/';
import { ActivatedRoute } from '@angular/router';
import { OrderItem } from '../_models/order';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  categories: Observable<Category[]>;
  products: Observable<Product[]>;
  noOfProducts: number;
  isCategoriesLoading = false;
  isProductsLoading = false;
  viewAsList = false;
  contactDetails: Contact;
  socialMedia: SocialMedia;

  /** Add to Cart */
  selectedProduct: Product;
  noOfItemsCart = 1;
  orderItems: OrderItem[] = [];
  totalAmount: number;

  isCheckAllFilters = true;
  isCheckAllCategories = true;
  isBestsellerChecked = true;
  isSoldoutChecked = true;
  isCategoryChecked: boolean[] = [];
  filterBestseller: boolean;
  filterOutOfStock: boolean;
  filterForPickUpOnly: boolean;

  /** For sort by */
  SORT_BY_PRODUCT_A_TO_Z = 0;
  SORT_BY_PRODUCT_Z_TO_A = 1;
  SORT_BY_PRICE_LOW_TO_HIGH = 2;
  SORT_BY_PRICE_HIGH_TO_LOW = 3;
  sortBy = this.SORT_BY_PRODUCT_A_TO_Z;

  constructor(
    private categoryService: CategoryService,
    private contactService: ContactService,
    private productService: ProductService,
    private socialMediaService: SocialmediaService,
    private route: ActivatedRoute,
    @Inject('BaseURL') public BaseURL
  ) { }

  ngOnInit() {
    this.getAllCategories();
    this.getContactDetails();
    this.getSocialMedia();
    this.loadCart();
    this.route.queryParams.subscribe(params => {
      if (params['category'] === undefined || params['category'] === '' || params['category'] === null) {
        this.getAllProducts();
      } else {
        const category_id = params['category'];
        this.getProductsByCategory(category_id);
      }
    });
    this.filterBestseller = true;
    this.filterOutOfStock = true;
    this.filterForPickUpOnly = true;
  }

  addToCart() {
    if (this.selectedProduct._id) {
      const orderItem: OrderItem = {
        product: this.selectedProduct,
        quantity: this.noOfItemsCart
      };
      if (localStorage.getItem('cart') === null) {
        const cart: any = [];
        cart.push(JSON.stringify(orderItem));
        localStorage.setItem('cart', JSON.stringify(cart));
      } else {
        const cart: any = JSON.parse(localStorage.getItem('cart'));
        let index = -1;
        for (let i = 0; i < cart.length; i++) {
          const item: OrderItem = JSON.parse(cart[i]);
          if (item.product._id === this.selectedProduct._id) {
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
      this.loadCart();
    } else {
      this.loadCart();
    }

    $('#addToCartModal').modal('hide');
    $('.modal-backdrop').remove();
    this.noOfItemsCart = 1;
  }

  loadCart() {
    this.totalAmount = 0;
    this.orderItems = [];
    const cart = JSON.parse(localStorage.getItem('cart'));
    if (cart === null) {
      return;
    }
    for (let i = 0; i < cart.length; i++) {
      const item = JSON.parse(cart[i]);
      this.orderItems.push({
        product: item.product,
        quantity: item.quantity
      });
      if (item.product.forPickupOnly) {
        this.totalAmount += item.product.price * item.quantity;
      } else {
        this.totalAmount += (item.product.price + item.product.deliveryFee) * item.quantity;
      }
    }
  }

  emptyCart() {
    localStorage.removeItem('cart');
  }

  removeFromCart(id: string) {
    const cart: any = JSON.parse(localStorage.getItem('cart'));
    const index = -1;
    for (let i = 0; i < cart.length; i++) {
      const item: OrderItem = JSON.parse(cart[i]);
      if (item.product._id === id) {
        cart.splice(i, 1);
        break;
      }
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    this.loadCart();
  }

  applyFilter() {
    this.getAllProducts();
    $('#sortFilterModal').modal('hide');
    $('.modal-backdrop').remove();
  }

  checkAllCategories(isCheck: boolean) {
    this.isCheckAllCategories = isCheck;
    this.categories.forEach(category => {
      for (let i = 0; i < category.length; i++) {
        $('input#' + category[i]._id + '.form-check-input').prop('checked', this.isCheckAllCategories);
        this.isCategoryChecked[i] = isCheck;
      }
    });
  }

  checkAllFilters(isCheckAllFilters: boolean) {
    this.isCheckAllFilters = isCheckAllFilters;
    this.isBestsellerChecked = isCheckAllFilters;
    this.isSoldoutChecked = isCheckAllFilters;
    $('#checkbox-bestseller').prop('checked', this.isCheckAllFilters);
    $('#checkbox-soldout').prop('checked', this.isCheckAllFilters);
  }

  clickCategory(id: string, index: number) {
    const isCategoryChecked = $('#' + id + '.form-check-input').prop('checked');
    this.isCategoryChecked[index] = isCategoryChecked;
    this.isCheckAllCategories = this.isAllCategoriesChecked();
  }

  clickFilter() {
    const isBestsellerChecked = $('#checkbox-bestseller').prop('checked');
    const isSoldoutChecked = $('#checkbox-soldout').prop('checked');
    this.isCheckAllFilters = isBestsellerChecked && isSoldoutChecked;
  }

  getAllCategories() {
    const tempCategories: Category[] = [];
    this.categoryService.getCategories().pipe(
      tap((categories: Category[]) => {
        for (let i = 0; i < categories.length; i++) {
          if (categories[i].parent === null) {
            tempCategories.push(categories[i]);
            this.isCategoryChecked.push(true);
            for (let j = 0; j < categories.length; j++) {
              if (categories[j].parent !== null && categories[j].parent._id === categories[i]._id) {
                tempCategories.push(categories[j]);
                this.isCategoryChecked.push(true);
                for (let k = 0; k < categories.length; k++) {
                  if (categories[k].parent !== null && categories[k].parent._id === categories[j]._id) {
                    tempCategories.push(categories[k]);
                    this.isCategoryChecked.push(true);
                  }
                }
              }
            }
          }
        }
      }),
      finalize(() => {
        this.categories = of(tempCategories);
      })
    ).subscribe();
  }

  getAllProducts() {
    this.isProductsLoading = true;
    this.products = this.productService.getProducts()
      .pipe(
          map((products) => {
            return products.filter(product => {
              let isFiltered = true;
              if (!this.isCheckAllCategories) {
                const isCategoryChecked = $('#' + product.category[0]._id + '.form-check-input').prop('checked');
                if (!isCategoryChecked) {
                  isFiltered = false;
                }
              }
              if ((!this.isBestsellerChecked || !this.filterBestseller) && product.isBestseller) {
                isFiltered = false;
              }
              if ((!this.isSoldoutChecked || !this.filterOutOfStock) && product.stock <= 0) {
                isFiltered = false;
              }
              if (!this.filterForPickUpOnly && product.forPickupOnly) {
                isFiltered = false;
              }
              return isFiltered;
            });
          }
        ),
        tap(products => {
          this.noOfProducts = products.length;
          // products.filter();
            products.sort((a, b) => {
            switch (this.sortBy) {
              case this.SORT_BY_PRODUCT_A_TO_Z:
                if (a.name < b.name) {
                  return -1;
                } else if (a.name > b.name) {
                  return 1;
                }
                return 0;
              case this.SORT_BY_PRODUCT_Z_TO_A:
                if (a.name > b.name) {
                  return -1;
                } else if (a.name < b.name) {
                  return 1;
                }
                return 0;
              case this.SORT_BY_PRICE_LOW_TO_HIGH:
                return a.price - b.price;
              case this.SORT_BY_PRICE_HIGH_TO_LOW:
                return b.price - a.price;
              default:
                if (a.name < b.name) {
                  return -1;
                } else if (a.name > b.name) {
                  return 1;
                }
            }
          });
        }),
        finalize(() => this.isProductsLoading = false)
      );
  }

  getProductsByCategory(category_id: number): void {
    this.isProductsLoading = true;
    this.products = this.productService.getProductsByCategory(category_id)
      .pipe(
        tap(products => this.noOfProducts = products.length),
        finalize(() => this.isProductsLoading = false)
      );
  }

  getContactDetails() {
    this.contactService.getContact()
      .pipe(
        tap(contact => {
          this.contactDetails = contact[0];
        })
      ).subscribe();
  }

  getSocialMedia() {
    this.socialMediaService.getSocialMedia()
      .subscribe(
        socialMedia => {
          this.socialMedia = socialMedia[0];
        }
      );
  }

  hasSubCategory(id: string): boolean {
    let hasSubCategory = false;
    this.categories.forEach(categories => {
      for (let i = 0; i < categories.length; i++) {
        if (categories[i].parent !== null && categories[i].parent._id === id) {
          hasSubCategory = true;
          break;
        }
      }
    });
    return hasSubCategory;
  }

  isAllCategoriesChecked(): boolean {
    let isAllCategoriesChecked = true;
    if (this.categories === undefined) {
      return false;
    }

    for (let i = 0; i < this.isCategoryChecked.length; i++) {
      if (!this.isCategoryChecked[i]) {
        isAllCategoriesChecked = false;
        break;
      }
    }
    return isAllCategoriesChecked;
  }

  selectProduct(product: Product) {
    this.selectedProduct = product;
  }

  selectSortBy(sortBy: number) {
    this.sortBy = sortBy;
    for (let i = 0; i < 4; i++) {
      if (this.sortBy === i) {
        $('#sortByOptions .page-item#' + i).addClass('active');
      } else {
        $('#sortByOptions .page-item#' + i).removeClass('active');
      }
    }
  }

  toggleView() {
    this.viewAsList = !this.viewAsList;
  }
}
