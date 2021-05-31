import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services/user.service';
import { SettingsService } from '../_services/settings.service';
import { User } from '../_models/user';
import { Settings } from '../_models/settings';
import { finalize, tap, map } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PasswordValidator } from '../_helpers/password.validator';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {

  user: User;
  settings: Settings;
  isProfileLoading = false;
  editProfileFormGroup: FormGroup;
  passwordFormGroup: FormGroup;
  shippingRatesFormGroup: FormGroup;
  editProfileLoading: boolean;
  submittedPassword: boolean;
  updateShippingRatesLoading: boolean;
  editPasswordError: string;
  changePasswordLoading: boolean;
  editPasswordSuccess: string;

  constructor(
    private userService: UserService,
    private settingsService: SettingsService,
    private formBuilder: FormBuilder
  ) {

    this.editProfileFormGroup = this.formBuilder.group({
      _id: ['', Validators.required],
      username: [{value: '', disabled: true}, Validators.required],
      name: ['', Validators.required],
      email:['', Validators.required],
      contact: ['', Validators.required],
      address: ['', Validators.required],
      role: [{value: '', disabled: true}, Validators.required],
    });

    this.passwordFormGroup = this.formBuilder.group({
      oldPassword: ['', Validators.required],
      password: ['', Validators.required],
      repeatPassword: ['', Validators.required]
    }, {
      validator: PasswordValidator.validate.bind(this)
    });

    this.shippingRatesFormGroup = this.formBuilder.group({
      northIslandShippingRate: [0, Validators.required],
      southIslandShippingRate: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.getProfile();
    this.getSettings();
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

  getSettings(): void {
    this.settingsService.getSettings()
      .pipe(tap(settings => {
        this.settings = settings;
        this.shippingRatesFormGroup.get('northIslandShippingRate').setValue(this.settings.northIslandShippingRate/100);
        this.shippingRatesFormGroup.get('southIslandShippingRate').setValue(this.settings.southIslandShippingRate/100);
      }))
      .subscribe();
  }

  cancel() {
    this.editProfileFormGroup.get('_id').setValue(this.user._id);
    this.editProfileFormGroup.get('username').setValue(this.user.username);
    this.editProfileFormGroup.get('name').setValue(this.user.name);
    this.editProfileFormGroup.get('email').setValue(this.user.email);
    this.editProfileFormGroup.get('contact').setValue(this.user.contact);
    this.editProfileFormGroup.get('address').setValue(this.user.address);
    this.editProfileFormGroup.get('role').setValue(this.user.role);
  }

  editProfile() {
    if (this.editProfileFormGroup.invalid) {
      return;
    }
    this.editProfileLoading = true;
    const user: User = this.editProfileFormGroup.value;
    this.userService.updateUser(user)
      .pipe(finalize(() => {
        this.editProfileLoading = false;
      }))
      .subscribe(
        data => {
          this.getProfile();
          $('#editProfileModal').hide();
          $('.modal-backdrop').remove();
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

  updateShippingRates() {

    let newSettings = new Settings();
    newSettings._id = this.settings._id;
    newSettings.northIslandShippingRate = this.shippingRatesFormGroup.get('northIslandShippingRate').value;
    newSettings.southIslandShippingRate = this.shippingRatesFormGroup.get('southIslandShippingRate').value;

    // this.update(newSettings);
    this.updateShippingRatesLoading = true;

    this.settingsService.updateSettings(newSettings)
      .pipe(finalize(() => {
        this.updateShippingRatesLoading = false;
      }))
      .subscribe(
        updated_settings => {
          this.settings = updated_settings;
          this.showMessageModal('Save', 'Shipping rates updated!');
        },
        error => {

        }
      );
  }

  allowPickup() {
    let newSettings = new Settings();
    newSettings._id = this.settings._id;
    newSettings.allowPickup = this.settings.allowPickup;

    this.update(newSettings);
  }

  acceptCash() {
    let newSettings = new Settings();
    newSettings._id = this.settings._id;
    newSettings.acceptCash = this.settings.acceptCash;

    this.update(newSettings);
  }

  acceptPaypal() {
    let newSettings = new Settings();
    newSettings._id = this.settings._id;
    newSettings.acceptPaypal = this.settings.acceptPaypal;

    this.update(newSettings);
  }

  update(newSettings: Settings) {

    this.settingsService.updateSettings(newSettings)
      .pipe()
      .subscribe(
        updated_settings => {
          this.settings = updated_settings;
        },
        error => {

        }
      );
  }

  showMessageModal(title: string, message: string) {
    $('div.modal-body').text(message);
    $('#messageModalTitle').text(title);
    $('#messageModal').modal('show');
  }

}
