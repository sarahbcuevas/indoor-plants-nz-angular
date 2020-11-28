import { isMetadataImportedSymbolReferenceExpression } from '@angular/compiler-cli';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderItem } from '../_models/order_item';
import { Product } from '../_models/product';
import location from '../../assets/cities.json';

declare const clickTab: any;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  subTotal: number;
  orderItems: OrderItem[] = [];
  selectedProduct = null;
  submitted = false;
  userInfoFormGroup: FormGroup;
  shippingFormGroup: FormGroup;
  paymentFormGroup: FormGroup;
  billingFormGroup: FormGroup;
  billingAddressFormGroup: FormGroup;
  countries = [];
  regions = [];
  cities = [];
  countryIndex = 0;
  regionIndex = 0;
  cityIndex = 0;
  totalShippingFee = 100;

  PAYPAL = 'paypal';
  CASH = 'cash';
  BANK_DEPOSIT = 'bank_deposit';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userInfoFormGroup = this.formBuilder.group({
      email: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      contact: ['', Validators.required],
      country: ['', Validators.required],
      region: ['', Validators.required],
      city: ['', Validators.required],
      address: ['', Validators.required],
      postal: ['', Validators.required],
      subscribe: [false],
      save: [true]
    });
    this.shippingFormGroup = this.formBuilder.group({
      forShipping: [false]
    });
    this.paymentFormGroup = this.formBuilder.group({
      paymentMethod: [this.CASH, Validators.required]
    });
    this.billingFormGroup = this.formBuilder.group({
      sameAsShippingAddress: [true]
    });
    this.billingAddressFormGroup = this.formBuilder.group({
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

  ngOnInit() {
    this.loadCart();
    this.loadCountries();
  }
  
  onTabClick() {
    clickTab();
  }

  selectProduct(product: Product) {
    this.selectedProduct = product;
  }

  loadCart() {
    this.subTotal = 0;
    this.orderItems = [];
    const cart = JSON.parse(localStorage.getItem('cart'));

    if (cart === null) {
      return;
    }
    for (let i = 0; i < cart.length; i++) {
      const item = JSON.parse(cart[i]);
      this.orderItems.push({
        product: item.product,
        quantity: item.quantity
      });
      this.subTotal += item.product.price * item.quantity;
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

  removeFromCart(id: string) {
    const cart: any = JSON.parse(localStorage.getItem('cart'));
    const index = -1;
    for (let i = 0; i < cart.length; i++) {
      const item: OrderItem = JSON.parse(cart[i]);
      if (item.product._id === id) {
        cart.splice(i, 1);
        break;
      }
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    this.loadCart();
  }

  removeProduct() {
    if (this.selectedProduct === null) {
      return;
    }
    this.removeFromCart(this.selectedProduct._id);
    $('#removeProductModal').modal('hide');
    $('.modal-backdrop').remove();
  }

  continueToShipping() {
    this.onTabClick();
    this.calculateShipping();
    this.userInfoFormGroup.get('country').setValue(this.countries[this.countryIndex]);
    this.userInfoFormGroup.get('region').setValue(this.regions[this.regionIndex]);
    this.userInfoFormGroup.get('city').setValue(this.cities[this.cityIndex]);
  }

  continueToPayment() {
    this.onTabClick();
  }

  completeOrder() {
    let isSameAsShippingAddress = this.billingFormGroup.get('sameAsShippingAddress').value;
    let save = this.userInfoFormGroup.get('save').value;
    let subscribe = this.userInfoFormGroup.get('subscribe').value;

    if (!isSameAsShippingAddress) {
      this.billingAddressFormGroup.get('country').setValue(this.countries[this.countryIndex]);
      this.billingAddressFormGroup.get('region').setValue(this.regions[this.regionIndex]);
      this.billingAddressFormGroup.get('city').setValue(this.cities[this.cityIndex]);
    }

    if (save) {
      this.saveCustomerInformation();
    }

    if (subscribe) {
      this.addToSubscriptionList();
    }

    console.log('Customer Information: ', this.userInfoFormGroup.value);
    console.log('Shipping: ', this.shippingFormGroup.value);
    console.log('Payment Method: ', this.paymentFormGroup.value);
    console.log('Is Same As Shipping Address: ', this.billingFormGroup.value);
    console.log('Another Billing Address: ', this.billingAddressFormGroup.value);

    /** TODO: SEND TO SERVER */

    this.emptyCart();

    let firstname = this.userInfoFormGroup.get('firstname').value;
    let trackingCode = 'EA13-0193-2549';

    this.router.navigate(['/order-confirmation'], 
      {queryParams: { name: firstname, code: trackingCode}});
  }

  emptyCart() {
    localStorage.removeItem('cart');
  }

  calculateShipping() {

  }

  saveCustomerInformation() {

  }

  addToSubscriptionList() {

  }
}
