import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../_services/category.service';
import { Category } from '../_models/category';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../_services/product.service';
import { Product, Photo } from '../_models/product';
import { tap, finalize } from 'rxjs/operators/';
import { baseURL } from '../_helpers/baseurl';
import { Router } from '@angular/router';
import { UploadService } from '../_services/upload.service';
import { initTinyMCE } from '../_helpers/tinymce';

declare const tinymce: any;

@Component({
  selector: 'app-admin-product-create',
  templateUrl: './admin-product-create.component.html',
  styleUrls: ['./admin-product-create.component.scss']
})
export class AdminProductCreateComponent implements OnInit {

  categories: Category[];
  createProductFormGroup: FormGroup;
  imageUrls: Photo[] = [];
  submitted: boolean;
  createProductError: string;
  loading: boolean;
  isImageUploading: boolean;
  noOfImagesUploading: number;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private formBuilder: FormBuilder,
    private router: Router,
    private uploadService: UploadService
  ) {
    this.createProductFormGroup = this.formBuilder.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      stock: [''],
      price: ['', Validators.required],
      deliveryFee: [''],
      forPickupOnly: [false],
      isBestseller: [false]
    });
  }

  ngOnInit(): void {
    initTinyMCE();
    this.getAllCategories();
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
      })
    ).subscribe(
      categories => {
        this.categories = categories;
      }
    );
  }

  makePrimaryPhoto(index) {
    for (var i=0; i<this.imageUrls.length; i++) {
      if (i == index) {
        this.imageUrls[i].isPrimary = true;
      } else {
        this.imageUrls[i].isPrimary = false;
      }
    }
  }

  onFileChange(event) {
    this.imageUrls = [];

    if (event.target.files) {
      
      this.noOfImagesUploading = event.target.files.length;
      this.isImageUploading = true;
      for (var i=0; i<event.target.files.length; i++) {
        this.getSignedRequest(event.target.files[i]);
      }
    }
  }

  getSignedRequest(file) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${baseURL}/sign-s3?file-name=${file.name}&file-type=${file.type}`);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
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
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var image = new Photo();
          image.url = url;
          this.imageUrls.push(image);
        } else {
          console.log('Could not upload file.');
        }

        if (this.noOfImagesUploading == this.imageUrls.length) {
          this.isImageUploading = false;
        }
      }
    };
    xhr.send(file);
  }

  removeImage(index) {
    let image = this.imageUrls.splice(index, 1);

    this.uploadService.deleteUpload(image[0].url).subscribe();
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
          product.images = this.imageUrls;
          product.description = tinymce.get("description").getContent();
          this.addProduct(product);
        })
      ).subscribe();
  }

  addProduct(product: Product) {
    console.log('Create product: ', product);
    this.productService.addProduct(product)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe(
        (prod: Product) => {
          $('#addNewProductModal').hide();
            $('.modal-backdrop').remove();
            this.createProductFormGroup.reset();
            this.router.navigate([`/admin/products/${prod._id}`], 
            {queryParams: { newProduct: true }});
        },
        error => {
          console.log('Error: ', error);
        }
      );
  }


}
