import { Component, OnInit, Inject } from '@angular/core';
import { CategoryService } from '../_services/category.service';
import { Category } from '../_models/category';
import { ProductService } from '../_services/product.service';
import { Product } from '../_models/product';
import { Observable, of } from 'rxjs';
import { finalize, tap, filter, map } from 'rxjs/operators/';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
// import { FileUploader } from 'ng2-file-upload/ng2-file-upload';
// import { HttpErrorResponse } from '@angular/common/http';
import { baseURL } from '../_helpers/baseurl';

// const URL = baseURL + '/uploads';

// interface UploadResponse {
//   success: boolean;
//   path: string;
// }

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss']
})
export class AdminProductsComponent implements OnInit {

  searchText: string;
  noOfProducts: number;
  isProductsLoading: boolean;
  loading: boolean;
  isImageUploading = false;
  submitted = false;
  products: Observable<Product[]>;
  categories: Observable<Category[]>;
  selectedProductId: string;
  selectedProductName: string;
  createProductError: string;
  createProductFormGroup: FormGroup;
  isCheckAllFilters = true;
  isCheckAllCategories = true;
  viewAsList = true;
  isBestsellerChecked = true;
  isSoldoutChecked = true;
  isCategoryChecked: boolean[] = [];
  productImageUrl: string;

  /** For sort by */
  SORT_BY_PRODUCT_A_TO_Z = 0;
  SORT_BY_PRODUCT_Z_TO_A = 1;
  SORT_BY_PRICE_LOW_TO_HIGH = 2;
  SORT_BY_PRICE_HIGH_TO_LOW = 3;
  sortBy = this.SORT_BY_PRODUCT_A_TO_Z;

  // public uploader: FileUploader = new FileUploader({url: URL, itemAlias: 'photo'});

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    @Inject('BaseURL') public BaseURL
  ) {
    this.createProductFormGroup = this.formBuilder.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      stock: [0],
      price: [0, Validators.required],
      deliveryFee: [0],
      forPickupOnly: [false],
      image: [''],
      isBestseller: [false]
    });
  }

  ngOnInit() {
    this.getAllProducts();
    this.getAllCategories();

    // this.uploader.onAfterAddingFile = (file) => {
    //   file.withCredentials = false;
    // };
  }

  addProduct(product: Product) {
    this.productService.addProduct(product)
      .pipe(finalize(() => {
        this.loading = false;
        this.getAllProducts();
      }))
      .subscribe(
        data => {
          // do nothing
        },
        error => {
          if (error === 'OK') {
            $('#addNewProductModal').modal('hide');
            $('.modal-backdrop').remove();
            this.createProductFormGroup.reset();
            this.resetForm();
          } else {
            this.createProductError = 'Product name already exists';
          }
        }
      );
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

  createNewProduct() {
    event.preventDefault();
    this.submitted = true;
    this.createProductError = null;
    // stop here if form is invalid
    if (this.createProductFormGroup.invalid) {
      return;
    }

    this.loading = true;
    const product: Product = this.createProductFormGroup.value;
    const categories = [];
    this.categoryService.getCategoryById(this.createProductFormGroup.get('category').value)
      .pipe(
        tap((cat: Category) => {
          categories.push({_id: cat._id});
          if (cat.parent !== null) {
            categories.push({_id: cat.parent._id});
            if (cat.parent.parent !== null) {
              categories.push({_id: cat.parent.parent});
            }
          }
          product.category = categories;
          // if (product.image) {
          //   this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
          //     const resp: UploadResponse = JSON.parse(response);
          //     if (resp.success) {
          //       product.image = resp.path;
          //     }
          //     this.addProduct(product);
          //   };
          //   this.uploader.uploadAll();
          // } else {
            product.image = this.productImageUrl;
            this.addProduct(product);
          // }
        })
      ).subscribe();
  }

  deleteProduct() {
    this.productService.deleteProductById(this.selectedProductId)
      .pipe(finalize(() => {
        $('#deleteProductModal').modal('hide');
        $('.modal-backdrop').remove();
      }))
      .subscribe(
        data => {
          this.getAllProducts();
        }
      );
  }

  deleteAllProducts() {
    this.productService.deleteAllProducts()
      .pipe(finalize(() => {
        $('#deleteAllProductsModal').modal('hide');
        $('.modal-backdrop').remove();
      }))
      .subscribe(
        data => {
          this.getAllProducts();
        }
      );
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

  selectProduct(id: string, name: string) {
    this.selectedProductId = id;
    this.selectedProductName = name;
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

  resetForm() {
    this.createProductFormGroup.reset();
    this.submitted = false;
    this.createProductError = null;
    this.productImageUrl = null;
  }

  toggleView() {
    this.viewAsList = !this.viewAsList;
  }

  onFileChange(fileInput) {
    const files = (<HTMLInputElement>document.getElementById('image')).files;
    const file = files[0];
    if (file === null) {
      return console.log('No file selected.');
    }
    this.isImageUploading = true;
    this.getSignedRequest(file);
  }

  getSignedRequest(file) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${baseURL}/sign-s3?file-name=${file.name}&file-type=${file.type}`);
    xhr.onreadystatechange = () => {
      console.log('xhr: ', xhr);
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log('response: ', response);
          this.uploadFile(file, response.signedRequest, response.url);
        } else {
          console.log('Could not get signed URL.');
        }
      }
    };
    xhr.send();
  }

  uploadFile(file, signedRequest, url) {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedRequest);
    xhr.onreadystatechange = () => {
      console.log('PUT xhr: ', xhr);
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.productImageUrl = url;
        } else {
          console.log('Could not upload file.');
        }
        this.isImageUploading = false;
      }
    };
    xhr.send(file);
  }
}
