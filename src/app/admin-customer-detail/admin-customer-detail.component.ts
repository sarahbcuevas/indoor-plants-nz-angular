import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Customer } from '../_models/customer';
import { finalize, map } from 'rxjs/operators';
import { CustomerService } from '../_services/customer.service';
import location from '../../assets/cities.json';

@Component({
  selector: 'app-admin-customer-detail',
  templateUrl: './admin-customer-detail.component.html',
  styleUrls: ['./admin-customer-detail.component.scss']
})
export class AdminCustomerDetailComponent implements OnInit {

  editCustomerFormGroup: FormGroup;
  editCustomerError: string;
  isEditOn: boolean;
  loading: boolean;
  submitted: boolean;
  customer: Customer;
  countries = [];
  regions = [];
  cities = [];
  countryIndex = 0;
  regionIndex = 0;
  cityIndex = 0;

  constructor(
    private formBuilder: FormBuilder,
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.editCustomerFormGroup = this.formBuilder.group({
      _id: ['', Validators.required],
      email: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      contact: ['', Validators.required],
      company: [''],
      country: ['', Validators.required],
      region: ['', Validators.required],
      city: ['', Validators.required],
      address: ['', Validators.required],
      postal: ['', Validators.required],
      subscribe: [false]
    });
  }

  ngOnInit(): void {
    this.loadCountries();
    this.getCustomerDetails();
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
    this.editCustomerFormGroup.get('_id').setValue(id);
    this.editCustomerFormGroup.get('email').setValue(this.customer.email);
    this.editCustomerFormGroup.get('firstname').setValue(this.customer.firstname);
    this.editCustomerFormGroup.get('lastname').setValue(this.customer.lastname);
    this.editCustomerFormGroup.get('contact').setValue(this.customer.contact);
    this.editCustomerFormGroup.get('company').setValue(this.customer.company);
    this.editCustomerFormGroup.get('country').setValue(this.countryIndex);
    this.editCustomerFormGroup.get('region').setValue(this.regionIndex);
    this.editCustomerFormGroup.get('city').setValue(this.cityIndex);
    this.editCustomerFormGroup.get('address').setValue(this.customer.address);
    this.editCustomerFormGroup.get('postal').setValue(this.customer.postal);
  
    this.editMode(false);
    this.submitted = false;
  }

  getCustomerDetails() {
    const id = this.route.snapshot.paramMap.get('id');
    this.customerService.getCustomerById(id)
      .pipe(map(customer => {
        this.customer = customer;
        this.loadLocation();
        this.cancel();
      }))
      .subscribe();
  }

  delete() {
    const id = this.route.snapshot.paramMap.get('id');
    this.customerService.deleteCustomerById(id)
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
    this.editCustomerError = null;
    if (this.editCustomerFormGroup.invalid) {
      return;
    }
    this.loading = true;
    const customer: Customer = this.editCustomerFormGroup.value;
    customer.country = this.countries[this.countryIndex];
    customer.region = this.regions[this.regionIndex];
    customer.city = this.cities[this.cityIndex];

    this.customerService.updateCustomer(customer)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe(
        data => {
          this.editMode(false);
          this.editCustomerError = null;
          this.getCustomerDetails();
        },
        error => {
          this.editCustomerError = 'Customer with that email already exists';
        }
      );
  }

  loadLocation() {
    if (this.customer === null || this.customer === undefined) {
      return;
    }

    for (let i=0; i<this.countries.length; i++) {
      if (this.customer.country === this.countries[i]) {
        this.countryIndex = i;
        break;
      }
    }

    this.selectCountry(this.countryIndex);

    for (let i=0; i<this.regions.length; i++) {
      if (this.customer.region === this.regions[i]) {
        this.regionIndex = i;
        break;
      }
    }

    this.selectRegion(this.regionIndex);

    for (let i=0; i<this.cities.length; i++) {
      if (this.customer.city === this.cities[i]) {
        this.cityIndex = i;
        break;
      }
    }
  }

  loadCountries() {
    this.countries = [];
    for (let i=0; i<location.length; i++) {
      this.countries.push(location[i].country);
    }
  }

  selectCountry(countryIndex) {
    this.regions = [];
    this.countryIndex = countryIndex;
    let data = location[countryIndex].regions;
    for (let i=0; i<data.length; i++) {
      this.regions.push(data[i].name);
    }
  }

  selectRegion(regionIndex) {
    this.cities = [];
    this.regionIndex = regionIndex;
    let data = location[this.countryIndex].regions[regionIndex].cities;
    for (let i=0; i<data.length; i++) {
      this.cities.push(data[i]);
    }
  }

  selectCity(cityIndex) {
    this.cityIndex = cityIndex;
  }

}
