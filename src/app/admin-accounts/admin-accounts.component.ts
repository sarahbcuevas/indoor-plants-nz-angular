import { Component, OnInit } from '@angular/core';
import { User } from '../_models/user';
import { UserService } from '../_services/user.service';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PasswordValidator } from '../_helpers/password.validator';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-accounts',
  templateUrl: './admin-accounts.component.html',
  styleUrls: ['./admin-accounts.component.scss']
})
export class AdminAccountsComponent implements OnInit {

  users: Observable<User[]>;
  isUsersLoading = false;
  registrationFormGroup: FormGroup;
  passwordFormGroup: FormGroup;
  submitted = false;
  loading: boolean;
  createUserError: string;
  selectedUserName: string;
  selectedUserId: string;
  searchText: string;

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
    this.registrationFormGroup = this.formBuilder.group({
      username: ['', Validators.required],
      passwordFormGroup: this.passwordFormGroup,
      name: ['', Validators.required],
      email: ['', Validators.required],
      contact: ['', Validators.required],
      address: ['', Validators.required],
      role: ['admin', Validators.required]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.registrationFormGroup.controls; }

  ngOnInit() {
    this.getUsers();
  }

  getUsers(): void {
    this.isUsersLoading = true;
    this.users = this.userService.getUsers()
      .pipe(finalize(() => this.isUsersLoading = false));
  }

  createNewUser(): void {
    event.preventDefault();
    this.createUserError = null;
    this.submitted = true;
    // stop here if form is invalid
    if (this.registrationFormGroup.invalid) {
      return;
    }

    this.loading = true;
    const user: User = this.registrationFormGroup.value;
    user.password = this.registrationFormGroup.get('passwordFormGroup').get('password').value;
    this.userService.registerUser(user)
      .pipe(finalize(() => {
        this.loading = false;
        this.getUsers();
      }))
      .subscribe(
        data => {
          $('#addNewUserModal').hide();
          $('.modal-backdrop').remove();
          this.registrationFormGroup.reset();
          this.resetForm();
        },
        error => {
          this.createUserError = 'Username already exists';
        }
      );
  }

  selectUser(id: string, username: string) {
    this.selectedUserId = id;
    this.selectedUserName = username;
  }

  deleteUser() {
    this.userService.deleteUserById(this.selectedUserId)
      .pipe(finalize(() => {
        $('#deleteUserModal').hide();
        $('.modal-backdrop').remove();
      }))
      .subscribe(
        data => {
          this.getUsers();
        }
      );
  }

  resetForm() {
    this.registrationFormGroup.reset();
    this.submitted = false;
    this.createUserError = null;
  }

}
