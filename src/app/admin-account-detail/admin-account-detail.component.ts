import { Component, OnInit } from '@angular/core';
import { User } from '../_models/user';
import { UserService } from '../_services/user.service';
import { finalize, map } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-account-detail',
  templateUrl: './admin-account-detail.component.html',
  styleUrls: ['./admin-account-detail.component.scss']
})
export class AdminAccountDetailComponent implements OnInit {

  user: User;
  editUserFormGroup: FormGroup;
  editUserError: string;
  isEditOn: boolean;
  loading: boolean;
  submitted: boolean;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {
    this.editUserFormGroup = this.formBuilder.group({
      _id: ['', Validators.required],
      username: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', Validators.required],
      contact: ['', Validators.required],
      address: ['', Validators.required]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.editUserFormGroup.controls; }

  ngOnInit() {
    this.getUserDetails();
  }

  getUserDetails() {
    const id = this.route.snapshot.paramMap.get('id');
    this.userService.getUserById(id)
      .pipe(map(user => {
        this.user = user;
        this.cancel();
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
    this.editUserFormGroup.get('_id').setValue(id);
    this.editUserFormGroup.get('username').setValue(this.user.username);
    this.editUserFormGroup.get('name').setValue(this.user.name);
    this.editUserFormGroup.get('email').setValue(this.user.email);
    this.editUserFormGroup.get('contact').setValue(this.user.contact);
    this.editUserFormGroup.get('address').setValue(this.user.address);
    this.editMode(false);
    this.submitted = false;
  }

  delete() {
    const id = this.route.snapshot.paramMap.get('id');
    this.userService.deleteUserById(id)
      .subscribe(
        data => {
          this.goBack();
          $('.modal-backdrop').remove();
        }
      );
  }

  goBack() {
    this.location.back();
  }

  save() {
    this.submitted = true;
    this.editUserError = null;
    if (this.editUserFormGroup.invalid) {
      return;
    }
    this.loading = true;
    const user: User = this.editUserFormGroup.value;

    this.userService.updateUser(user)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe(
        data => {
          this.editMode(false);
          this.editUserError = null;
          this.getUserDetails();
        },
        error => {
          this.editUserError = 'Username already exists';
        }
      );
  }
}
