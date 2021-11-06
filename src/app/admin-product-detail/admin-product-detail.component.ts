import { Component, OnInit, Inject } from '@angular/core';
import { Product, Photo } from '../_models/product';
import { Category } from '../_models/category';
import { ProductService } from '../_services/product.service';
import { CategoryService } from '../_services/category.service';
import { UploadService } from '../_services/upload.service';
import { ActivatedRoute } from '@angular/router';
import { finalize, map, tap } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FileUploader } from 'ng2-file-upload';
import { baseURL } from '../_helpers/baseurl';
import { initTinyMCE } from '../_helpers/tinymce';

const URL = baseURL + '/uploads';
declare const tinymce: any;

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
  categories: Category[];
  editProductFormGroup: FormGroup;
  loading: boolean;
  submitted: boolean;
  imageUrls: Photo[] = [];
  isImageUploading = false;
  noOfImagesUploading: number;
  isNewProduct: boolean = false;

  public uploader: FileUploader = new FileUploader({url: URL, itemAlias: 'photo'});

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private categoryService: CategoryService,
    private uploadService: UploadService,
    private formBuilder: FormBuilder,
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
      isBestseller: [false]
    });

  }

  ngOnInit() {
    this.getAllCategories();
    this.getProductDetails();

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.isNewProduct = this.route.snapshot.queryParams['newProduct'];
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
        this.categories = tempCategories;
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

  cancel() {
    console.log('Cancel product: ', this.product);
    this.editProductFormGroup.get('_id').setValue(this.product._id);
    this.editProductFormGroup.get('name').setValue(this.product.name);
    this.editProductFormGroup.get('category').setValue(this.product.category[0]._id);
    this.editProductFormGroup.get('stock').setValue(this.product.stock);
    this.editProductFormGroup.get('price').setValue((this.product.price / 100).toFixed(2));
    this.editProductFormGroup.get('deliveryFee').setValue((this.product.deliveryFee / 100).toFixed(2));
    this.editProductFormGroup.get('forPickupOnly').setValue(this.product.forPickupOnly);
    this.editProductFormGroup.get('isBestseller').setValue(this.product.isBestseller);
    this.editProductFormGroup.get('description').setValue(this.product.description);
    this.imageUrls = this.product.images;
    initTinyMCE();
    console.log('form: ', this.editProductFormGroup.value);
    console.log('isInvalid: ', this.editProductFormGroup.invalid);
  }

  removeImage(index) {
    let image = this.imageUrls.splice(index, 1);

    this.uploadService.deleteUpload(image[0].url).subscribe();
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
    if (event.target.files) {
      
      this.noOfImagesUploading = this.imageUrls.length + event.target.files.length;
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

  save() {
    event.preventDefault();
    this.submitted = true;
    this.editProductError = null;
    this.isNewProduct = false;
    // stop here if form is invalid or untouched
    if (this.editProductFormGroup.invalid || this.editProductFormGroup.pristine) {
      return;
    }
    this.loading = true;
    const product: Product = this.editProductFormGroup.value;

    const tempCategories = [];
    for (let category of this.categories) {
      if (category._id == this.editProductFormGroup.get('category').value) {
        tempCategories.push({_id: category._id});
        if (category.parent !== null) {
          tempCategories.push({_id: category.parent._id});
          if (category.parent.parent !== null) {
            tempCategories.push({_id: category.parent.parent});
          }
        }
        product.category = tempCategories;
        product.images = this.imageUrls;
        product.description = tinymce.get("description").getContent();
        this.updateProduct(product);
      }
    }
  }

  updateProduct(product: Product) {
    console.log('product before save: ', product);
    this.productService.updateProduct(product)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe(
        data => {
          this.editProductError = null;
          this.getProductDetails();
          this.showMessageModal('Save', 'Product updated!');
        },
        error => {
          this.editProductError = error;
        }
      );
  }

  showMessageModal(title: string, message: string) {
    window.scroll(0, 0);
    $('div.modal-body').text(message);
    $('#messageModalTitle').text(title);
    $('#messageModal').modal('show');
  }
}
