import { Component, OnInit, Inject } from '@angular/core';
import { User } from '../_models/user';
import { UserService } from '../_services/user.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PasswordValidator } from '../_helpers/password.validator';
import { finalize, map } from 'rxjs/operators';
import { Location } from '@angular/common';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss']
})
export class AdminProfileComponent implements OnInit {

  user: User;
  passwordFormGroup: FormGroup;
  editProfileFormGroup: FormGroup;
  editUserError: string;
  editPasswordError: string;
  editPasswordSuccess: string;
  isEditOn: boolean;
  submitted: boolean;
  submittedPassword: boolean;
  loading: boolean;
  changePasswordLoading: boolean;
  isProfileLoading = false;

  constructor(
    private userService: UserService,
    private location: Location,
    private formBuilder: FormBuilder,
    @Inject('BaseURL') public BaseURL
  ) {
    this.passwordFormGroup = this.formBuilder.group({
      oldPassword: ['', Validators.required],
      password: ['', Validators.required],
      repeatPassword: ['', Validators.required]
    }, {
      validator: PasswordValidator.validate.bind(this)
    });
    this.editProfileFormGroup = this.formBuilder.group({
      _id: ['', Validators.required],
      username: ['', Validators.required],
      name: ['', Validators.required],
      email:['', Validators.required],
      contact: ['', Validators.required],
      address: ['', Validators.required],
      role: [{value: '', disabled: true}, Validators.required],
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.editProfileFormGroup.controls; }

  ngOnInit(): void {
    this.getProfile();
    this.resetPasswordForm();
  }

  getProfile(): void {
    this.isProfileLoading = true;
    this.userService.getCurrentUser()
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
    this.editProfileFormGroup.get('_id').setValue(this.user._id);
    this.editProfileFormGroup.get('username').setValue(this.user.username);
    this.editProfileFormGroup.get('name').setValue(this.user.name);
    this.editProfileFormGroup.get('email').setValue(this.user.email);
    this.editProfileFormGroup.get('contact').setValue(this.user.contact);
    this.editProfileFormGroup.get('address').setValue(this.user.address);
    this.editProfileFormGroup.get('role').setValue(this.user.role);
    this.editMode(false);
    this.submitted = false;
  }

  goBack() {
    this.location.back();
  }

  save() {
    this.submitted = true;
    this.editUserError = null;
    if (this.editProfileFormGroup.invalid) {
      return;
    }
    this.loading = true;
    const user: User = this.editProfileFormGroup.value;
    this.userService.updateUser(user)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe(
        data => {
          this.editMode(false);
          this.editUserError = null;
          this.getProfile();
        },
        error => {
          this.editUserError = 'Username already exists';
        }
      );
  }

  resetPasswordForm() {
    this.passwordFormGroup.get('oldPassword').setValue('');
    this.passwordFormGroup.get('password').setValue('');
    this.passwordFormGroup.get('repeatPassword').setValue('');
    this.submittedPassword = false;
  }

  savePassword() {
    this.submittedPassword = true;
    this.editPasswordError = null;
    if (this.passwordFormGroup.invalid) {
      return;
    }
    this.changePasswordLoading = true;
    var oldPassword = this.passwordFormGroup.get('oldPassword').value;
    var newPassword = this.passwordFormGroup.get('password').value;
    this.userService.updateUserPassword(oldPassword, newPassword)
      .pipe(finalize(() => {
        this.changePasswordLoading = false;
      }))
      .subscribe(
        data => {
          this.editPasswordError = null;
          this.editPasswordSuccess = "Successfully updated password!";
          this.resetPasswordForm();
        },
        err => {
          this.editPasswordError = 'Password is incorrect!';
        }
      );
  }
}
