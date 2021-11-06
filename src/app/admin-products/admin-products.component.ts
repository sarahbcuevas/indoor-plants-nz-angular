import { Component, OnInit, Inject } from '@angular/core';
import { CategoryService } from '../_services/category.service';
import { Category } from '../_models/category';
import { ProductService } from '../_services/product.service';
import { Product } from '../_models/product';
import { finalize, tap, filter, map } from 'rxjs/operators/';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

export const Sort = {
  'PRODUCT_A_TO_Z': 'Product (A to Z)',
  'PRODUCT_Z_TO_A': 'Product (Z to A)'
};

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss']
})
export class AdminProductsComponent implements OnInit {

  searchText: string;
  noOfProducts: number;
  isProductsLoading: boolean;
  products: Product[];
  categories: Category[];
  selectedProductId: string;
  selectedProductName: string;
  isCheckAllFilters = true;
  isCheckAllCategories = true;
  isBestsellerChecked = true;
  isSoldoutChecked = true;
  isCategoryChecked: boolean[] = [];
  isSelectVisible = false;
  selectedProducts: string[] = [];
  sortFormGroup: FormGroup;

  SortMode = Sort.PRODUCT_A_TO_Z;
  SortType = Sort;

  PRODUCT_NAME = 'Product name';
  CATEGORY_NAME = 'Category name';
  SearchBarFilter = this.PRODUCT_NAME;

  /** For sort by */
  // SORT_BY_PRODUCT_A_TO_Z = 0;
  // SORT_BY_PRODUCT_Z_TO_A = 1;
  // SORT_BY_PRICE_LOW_TO_HIGH = 2;
  // SORT_BY_PRICE_HIGH_TO_LOW = 3;
  // sortBy = this.SORT_BY_PRODUCT_A_TO_Z;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    @Inject('BaseURL') public BaseURL
  ) {

    this.sortFormGroup = this.formBuilder.group({
      sortBy: [Sort.PRODUCT_A_TO_Z, Validators.required]
    });

  }

  ngOnInit() {
    this.getAllProducts();
    this.getAllCategories();
  }

  applyFilter() {
    this.getAllProducts();
    $('#sortFilterModal').hide();
    $('.modal-backdrop').remove();
  }

  checkAllCategories(isCheck: boolean) {
    this.isCheckAllCategories = isCheck;
    for (let i = 0; i < this.categories.length; i++) {
      $('input#' + this.categories[i]._id + '.form-check-input').prop('checked', this.isCheckAllCategories);
      this.isCategoryChecked[i] = isCheck;
    }
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

  deleteProduct() {
    this.productService.deleteProductById(this.selectedProductId)
      .pipe(finalize(() => {
        $('#deleteProductModal').hide();
        $('.modal-backdrop').remove();
      }))
      .subscribe(
        data => {
          this.getAllProducts();
        }
      );
  }

  deleteProducts() {
    this.productService.deleteProducts(this.selectedProducts)
      .pipe(finalize(() => {
        $('#deleteProductsModal').hide();
      }))
      .subscribe(
        data => {
          this.getAllProducts();
        }
      );
  }

  filterBy(filter) {
    this.SearchBarFilter = filter;
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
        this.categories = tempCategories;
      })
    ).subscribe();
  }

  getAllProducts() {
    this.isProductsLoading = true;
    this.resetSelectedProducts();
    this.productService.getProducts()
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
              if (!this.isBestsellerChecked && product.isBestseller) {
                isFiltered = false;
              }
              if (!this.isSoldoutChecked && product.stock <= 0) {
                isFiltered = false;
              }
              return isFiltered;
            });
          }
        ),
        tap(products => {
          this.noOfProducts = products.length;
            products.sort((a, b) => {

              switch(this.SortMode) {
                case Sort.PRODUCT_A_TO_Z:
                  if (a.name < b.name) {
                    return -1;
                  } else if (a.name > b.name) {
                    return 1;
                  }
                  return 0;
                case Sort.PRODUCT_Z_TO_A:
                  if (a.name > b.name) {
                    return -1;
                  } else if (a.name < b.name) {
                    return 1;
                  }
                  return 0;
              }
            // switch (this.sortBy) {
            //   case this.SORT_BY_PRODUCT_A_TO_Z:
            //     if (a.name < b.name) {
            //       return -1;
            //     } else if (a.name > b.name) {
            //       return 1;
            //     }
            //     return 0;
            //   case this.SORT_BY_PRODUCT_Z_TO_A:
            //     if (a.name > b.name) {
            //       return -1;
            //     } else if (a.name < b.name) {
            //       return 1;
            //     }
            //     return 0;
            //   case this.SORT_BY_PRICE_LOW_TO_HIGH:
            //     return a.price - b.price;
            //   case this.SORT_BY_PRICE_HIGH_TO_LOW:
            //     return b.price - a.price;
            //   default:
            //     if (a.name < b.name) {
            //       return -1;
            //     } else if (a.name > b.name) {
            //       return 1;
            //     }
            // }
          });
        }),
        finalize(() => this.isProductsLoading = false)
      )
      .subscribe(
        products => {
          this.products = products;
        }
      );
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

  isProductSelected(id) {
    return this.selectedProducts.indexOf(id) >= 0;
  }

  resetSelectedProducts() {
    this.selectedProducts = [];
  }

  toggleAll(target) {
    const isChecked = target.type === 'checkbox' ? target.checked : target.value;
    this.selectedProducts = [];

    for (let product of this.products) {
      $('#' + product._id + '.checkbox').prop('checked', isChecked);
      if (isChecked) {
        this.selectedProducts.push(product._id);
      }
    }
  }

  toggleSelection(product: Product) {
    if (this.isProductSelected(product._id)) {
      this.selectedProducts.splice(this.selectedProducts.indexOf(product._id), 1);
    } else {
      this.selectedProducts.push(product._id);
    }
  }

  selectProduct(id: string, name: string) {
    this.selectedProductId = id;
    this.selectedProductName = name;
  }

  // selectSortBy(sortBy: number) {
  //   this.sortBy = sortBy;
  //   for (let i = 0; i < 4; i++) {
  //     if (this.sortBy === i) {
  //       $('#sortByOptions .page-item#' + i).addClass('active');
  //     } else {
  //       $('#sortByOptions .page-item#' + i).removeClass('active');
  //     }
  //   }
  // }

  showSelect() {
    this.isSelectVisible = !this.isSelectVisible;
  }

  sortProducts() {
    this.SortMode = this.sortFormGroup.get('sortBy').value;
    this.getAllProducts();
  }
}
