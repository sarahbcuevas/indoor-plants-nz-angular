import { Component, OnInit, Inject } from '@angular/core';
import { Product } from '../_models/product';
import { Category } from '../_models/category';
import { ProductService } from '../_services/product.service';
import { CategoryService } from '../_services/category.service';
import { UploadService } from '../_services/upload.service';
import { ActivatedRoute } from '@angular/router';
import { finalize, map, tap } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { Location } from '@angular/common';
import { FileUploader } from 'ng2-file-upload';
import { baseURL } from '../_helpers/baseurl';

const URL = baseURL + '/uploads';

interface UploadResponse {
  success: boolean;
  path: string;
}

@Component({
  selector: 'app-admin-product-detail',
  templateUrl: './admin-product-detail.component.html',
  styleUrls: ['./admin-product-detail.component.scss']
})
export class AdminProductDetailComponent implements OnInit {

  editProductError: string;
  product: Product;
  categories: Observable<Category[]>;
  editProductFormGroup: FormGroup;
  isEditOn: boolean;
  loading: boolean;
  submitted: boolean;
  tempImage: string;

  public uploader: FileUploader = new FileUploader({url: URL, itemAlias: 'photo'});

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private categoryService: CategoryService,
    private uploadService: UploadService,
    private formBuilder: FormBuilder,
    private location: Location,
    @Inject('BaseURL') public BaseURL
  ) {
    this.editProductFormGroup = this.formBuilder.group({
      _id: ['', Validators.required],
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
    this.getAllCategories();
    this.getProductDetails();

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
  }

  getAllCategories() {
    const tempCategories: Category[] = [];
    this.categoryService.getCategories().pipe(
      tap((categories: Category[]) => {
        for (let i = 0; i < categories.length; i++) {
          if (categories[i].parent === null) {
            tempCategories.push(categories[i]);
            for (let j = 0; j < categories.length; j++) {
              if (categories[j].parent !== null && categories[j].parent._id === categories[i]._id) {
                tempCategories.push(categories[j]);
                for (let k = 0; k < categories.length; k++) {
                  if (categories[k].parent !== null && categories[k].parent._id === categories[j]._id) {
                    tempCategories.push(categories[k]);
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

  getProductDetails() {
    const id = this.route.snapshot.paramMap.get('id');
    this.productService.getProductById(id)
      .pipe(map(product => {
        this.product = product;
        this.cancel();  // to initialize the form with product detail values
      }))
      .subscribe();
  }

  editMode(isEditOn: boolean) {
    this.isEditOn = isEditOn;
    if (isEditOn) {
      $('fieldset').removeAttr('disabled');
    } else {
      $('fieldset').prop('disabled', 'disabled');
    }
  }

  cancel() {
    const id = this.route.snapshot.paramMap.get('id');
    if (this.tempImage) {
      this.product.image = this.tempImage;
      this.tempImage = '';
    }
    this.editProductFormGroup.get('_id').setValue(id);
    this.editProductFormGroup.get('name').setValue(this.product.name);
    this.editProductFormGroup.get('category').setValue(this.product.category[0]);
    this.editProductFormGroup.get('description').setValue(this.product.description);
    this.editProductFormGroup.get('stock').setValue(this.product.stock);
    this.editProductFormGroup.get('price').setValue((this.product.price / 100).toFixed(2));
    this.editProductFormGroup.get('deliveryFee').setValue((this.product.deliveryFee / 100).toFixed(2));
    this.editProductFormGroup.get('forPickupOnly').setValue(this.product.forPickupOnly);
    this.editProductFormGroup.get('isBestseller').setValue(this.product.isBestseller);
    // this.editProductFormGroup.get('image').setValue(this.product.image);
    this.editMode(false);
  }

  goBack() {
    this.location.back();
  }

  delete() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log(`Product image: ${this.product.image}`);
    this.productService.deleteProductById(id)
      .subscribe(
        data => {
          if (this.product.image !== null && this.product.image !== '' && this.product.image !== undefined) {
            const pathToDelete = this.product.image.replace('/images/', '');
            this.uploadService.deleteUpload(pathToDelete).subscribe();
          }
          this.goBack();
          $('.modal-backdrop').remove();
        }
      );
  }

  removeImage() {
    this.tempImage = this.product.image;
    this.product.image = '';
    this.editProductFormGroup.get('image').setValue('');
  }

  updateProduct(product: Product) {
    this.productService.updateProduct(product)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe(
        data => {
          this.editProductError = null;
          this.getProductDetails();
          this.editMode(false);
        },
        error => {
          this.editProductError = 'Product name already exists';
        }
      );
  }

  save() {
    this.submitted = true;
    this.editProductError = null;
    if (this.editProductFormGroup.invalid) {
      return;
    }
    this.loading = true;
    const product: Product = this.editProductFormGroup.value;

    if (product.image !== null && product.image !== '' && product.image !== undefined) {
      this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
        const resp: UploadResponse = JSON.parse(response);
        if (resp.success) {
          const pathToDelete = this.product.image.replace('/images/', '');
          this.uploadService.deleteUpload(pathToDelete).subscribe();
          product.image = resp.path;
        }
        this.updateProduct(product);
      };
      this.uploader.uploadAll();
    } else if (product.image === '' && this.tempImage) {
      const pathToDelete = this.tempImage.replace('/images/', '');
      this.uploadService.deleteUpload(pathToDelete).subscribe();
      this.updateProduct(product);
      this.tempImage = '';
    } else {
      product.image = this.product.image;
      this.updateProduct(product);
    }
  }

}
