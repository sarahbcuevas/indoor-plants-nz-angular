import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../_services/category.service';
import { Category } from '../_models/category';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-categories',
  templateUrl: './admin-categories.component.html',
  styleUrls: ['./admin-categories.component.scss']
})
export class AdminCategoriesComponent implements OnInit {

  categories: Category[];
  categoriesLoading: boolean;
  selectedCategoryId: string;
  selectedCategoryName: string;
  loading: boolean;
  addCategoryError: string;
  categoryFormGroup: FormGroup;
  editCategoryFormGroup: FormGroup;
  isEditOn: boolean;
  editCategoryError: string;

  constructor(
    private categoryService: CategoryService,
    private formBuilder: FormBuilder
  ) {
    this.categoryFormGroup = this.formBuilder.group({
      name: ['', Validators.required]
    });

    this.editCategoryFormGroup = this.formBuilder.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.getAllCategories();
  }

  addCategory(parentId: string) {
    // stop here if form is invalid
    if (this.categoryFormGroup.invalid) {
      return;
    }

    this.loading = true;
    const category: Category = this.categoryFormGroup.value;
    if (parentId !== null) {
      category.parent = {_id: parentId, name: null, parent: null};
    }
    this.categoryService.addCategory(category)
      .pipe(finalize(() => {
        this.loading = false;
        this.getAllCategories();
        this.categoryFormGroup.reset();
      }))
      .subscribe(
        data => {
          console.log(`success`);
          this.categoryFormGroup.reset();
        },
        error => {
          if (error instanceof HttpErrorResponse) {
            this.addCategoryError = error.error.err.message;
          }
        }
      );
  }

  deleteAllCategories() {
    this.categoryService.deleteAllCategories()
      .pipe(finalize(() => {
        $('#deleteAllCategoriesModal').hide();
        $('.modal-backdrop').remove();
      }))
      .subscribe(
        data => {
          this.getAllCategories();
        }
      );
  }

  deleteCategory() {
    this.categoryService.deleteCategoryById(this.selectedCategoryId)
      .pipe(finalize(() => {
        $('#deleteCategoryModal').hide();
        $('.modal-backdrop').remove();
      }))
      .subscribe(
        data => {
          this.getAllCategories();
        }
      );
  }

  getAllCategories() {
    this.categoriesLoading = true;
    this.categoryService.getCategories()
      .pipe(finalize(() => this.categoriesLoading = false))
      .subscribe(
        categories => {
          this.categories = categories;
        }
      );
  }

  selectCategory(id: string, category: string) {
    this.selectedCategoryId = id;
    this.selectedCategoryName = category;
  }

  editMode(isEditOn: boolean) {
    this.isEditOn = isEditOn;
  }

  saveChanges(id: string) {
    if (this.editCategoryFormGroup.invalid) {
      return;
    }

    this.loading = true;
    const name = this.editCategoryFormGroup.get('name').value;
    const category: Category = new Category();
    if (name !== '') {
      category.name = name;
    }
    category._id = id;

    this.categoryService.updateCategory(category)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe(
        data => {
          this.editMode(false);
          this.getAllCategories();
        }
      );
  }

  selectCategoryForEdit(id: string, category: string) {
    this.selectedCategoryId = id;
    this.selectedCategoryName = category;
    this.editMode(true);
    this.editCategoryFormGroup.get('name').setValue(this.selectedCategoryName);
  }

}
