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
  isEditOn: boolean;
  submitted: boolean;
  loading: boolean;
  isProfileLoading = false;

  constructor(
    private userService: UserService,
    private location: Location,
    private formBuilder: FormBuilder,
    @Inject('BaseURL') public BaseURL
  ) {
    this.passwordFormGroup = this.formBuilder.group({
      password: ['', Validators.required],
      repeatPassword: ['', Validators.required]
    }, {
      validator: PasswordValidator.validate.bind(this)
    });
    this.editProfileFormGroup = this.formBuilder.group({
      _id: ['', Validators.required],
      username: ['', Validators.required],
      passwordFormGroup: this.passwordFormGroup,
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
  }

  getProfile(): void {
    this.isProfileLoading = true;
    this.userService.getCurrentUser()
      .pipe(map(user => {
        this.user = user;
        this.cancel();
        console.log('User: ', user);
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
    this.editProfileFormGroup.get('passwordFormGroup').get('password').setValue(this.user.password);
    this.editProfileFormGroup.get('passwordFormGroup').get('repeatPassword').setValue(this.user.password);
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
    user.password = this.editProfileFormGroup.get('passwordFormGroup').get('password').value;
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
}
