import { Component, OnInit } from '@angular/core';
import { Customer } from '../_models/customer';
import { CustomerService } from '../_services/customer.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import location from '../../assets/cities.json';

@Component({
  selector: 'app-admin-customers',
  templateUrl: './admin-customers.component.html',
  styleUrls: ['./admin-customers.component.scss']
})
export class AdminCustomersComponent implements OnInit {

  searchText: string;
  customers: Observable<Customer[]>;
  isCustomersLoading: boolean;
  createCustomerError: string;
  loading: boolean;
  createCustomerFormGroup: FormGroup;
  countries = [];
  regions = [];
  cities = [];
  countryIndex = 0;
  regionIndex = 0;
  cityIndex = 0;
  selectedCustomerId: string;
  selectedCustomerName: string;
  submitted: boolean;

  constructor(
    private customerService: CustomerService,
    private formBuilder: FormBuilder
  ) {
    this.createCustomerFormGroup = this.formBuilder.group({
      email: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      contact: ['', Validators.required],
      country: ['', Validators.required],
      region: ['', Validators.required],
      city: ['', Validators.required],
      address: ['', Validators.required],
      postal: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getCustomers();
    this.loadCountries();
  }

  getCustomers(): void {
    this.isCustomersLoading = true;
    this.customers = this.customerService.getCustomers()
      .pipe(finalize(() => this.isCustomersLoading = false));
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

  selectCustomer(id: string, name: string) {
    this.selectedCustomerId = id;
    this.selectedCustomerName = name;
  }

  resetForm() {
    this.createCustomerFormGroup.reset();
    this.submitted = false;
    this.createCustomerError = null;
  }

  createNewCustomer() {
    event.preventDefault();
    this.createCustomerError = null;
    this.submitted = true;
    // stop here if form is invalid
    if (this.createCustomerFormGroup.invalid) {
      return;
    }

    this.loading = true;
    const customer: Customer = this.createCustomerFormGroup.value;
    customer.country = this.countries[this.countryIndex];
    customer.region = this.regions[this.regionIndex];
    customer.city = this.cities[this.cityIndex];

    this.customerService.createCustomer(customer)
      .pipe(finalize(() => {
        this.loading = false;
        this.getCustomers();
      }))
      .subscribe(
        data => {
          // do nothing
        },
        error => {
          if (error === 'OK') {
            $('#addNewCustomerModal').hide();
            $('.modal-backdrop').remove();
            this.createCustomerFormGroup.reset();
            this.resetForm();
          } else {
            this.createCustomerError = 'Customer with that email already exists';
          }
        }
      );
  }

  deleteCustomer() {
    this.customerService.deleteCustomerById(this.selectedCustomerId)
      .pipe(finalize(() => {
        $('#deleteCustomerModal').hide();
        $('.modal-backdrop').remove();
      }))
      .subscribe(
        data => {
          this.getCustomers();
        }
      );
  }

}
