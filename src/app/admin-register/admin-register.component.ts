import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../_services/user.service';
import { User } from '../_models/user';
import { finalize } from 'rxjs/operators';
import { PasswordValidator } from '../_helpers/password.validator';

@Component({
  selector: 'app-admin-register',
  templateUrl: './admin-register.component.html',
  styleUrls: ['./admin-register.component.scss']
})
export class AdminRegisterComponent implements OnInit {

  registerError: string;
  registerSuccess: string;
  registerUserFormGroup: FormGroup;
  passwordFormGroup: FormGroup;
  loading: boolean;
  submitted: boolean;

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {
    this.passwordFormGroup = this.formBuilder.group({
      password: ['', Validators.required],
      repeatPassword: ['', Validators.required]
    }, {
      validator: PasswordValidator.validate.bind(this)
    });
    this.registerUserFormGroup = this.formBuilder.group({
      username: ['', Validators.required],
      passwordFormGroup: this.passwordFormGroup,
      name: ['', Validators.required],
      email: ['', Validators.required],
      contact: ['', Validators.required],
      address: ['', Validators.required]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.registerUserFormGroup.controls; }

  ngOnInit() {
  }

  createNewUser() {
    this.registerError = null;
    this.registerSuccess = null;
    this.submitted = true;
    // stop here if form is invalid
    if (this.registerUserFormGroup.invalid) {
      return;
    }

    this.loading = true;
    const user: User = this.registerUserFormGroup.value;
    user.password = this.registerUserFormGroup.get('passwordFormGroup').get('password').value;
    this.userService.registerUser(user)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe(
        data => {
          this.resetForm();
          this.registerSuccess = 'Successfully registered new user!';
        },
        error => {
          this.registerError = 'Username already exists';
        }
      );
  }

  resetForm() {
    this.registerUserFormGroup.reset();
    this.submitted = false;
    this.registerError = null;
    this.registerSuccess = null;
    this.loading = false;
  }

}
