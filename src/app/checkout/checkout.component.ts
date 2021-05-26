import { isMetadataImportedSymbolReferenceExpression } from '@angular/compiler-cli';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderItem, Order, PaymentMethod, ShippingDetails, ShippingFeeMethod } from '../_models/order';
import { Customer } from '../_models/customer';
import { Product } from '../_models/product';
import { CustomerService } from '../_services/customer.service';
import { OrderService } from '../_services/order.service';
import { ProductService } from '../_services/product.service';
import location from '../../assets/cities.json';
import { finalize } from 'rxjs/operators';
import { render } from 'creditcardpayments/creditCardPayments';

declare const clickTab: any;
declare var paypal;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  @ViewChild('paypalCheckoutButtons', { static: true }) paypalElement: ElementRef;
  @ViewChild('paypalCompleteOrderButton', { static: true }) paypalCompleteOrderElement: ElementRef;

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
  totalShippingFee: number = 0;
  customer: Customer;
  isShippingAllowed: boolean;
  Payment_Method = PaymentMethod;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private orderService: OrderService,
    private productService: ProductService
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
      subscribe: [true],
      save: [true]
    });
    this.shippingFormGroup = this.formBuilder.group({
      forShipping: [false]
    });
    this.paymentFormGroup = this.formBuilder.group({
      paymentMethod: [PaymentMethod.CASH, Validators.required]
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

    this.paymentFormGroup.get('paymentMethod').valueChanges.subscribe(method => {
      let element = document.querySelector<HTMLElement>('#paypalCompleteOrderButton');
      if (method === PaymentMethod.PAYPAL) {
        element.style.display = 'inline-block';
      } else {
        element.style.display = 'none';
      }
    });
  }

  ngOnInit() {
    this.loadCart();
    this.loadCountries();
    document.querySelector<HTMLElement>('#paypalCompleteOrderButton');
    if (this.paymentFormGroup.get('paymentMethod').value == PaymentMethod.PAYPAL) {
      document.querySelector<HTMLElement>('#paypalCompleteOrderButton').style.display = 'inline-block';
    } else {
      document.querySelector<HTMLElement>('#paypalCompleteOrderButton').style.display = 'none';
    }
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
    this.isShippingAllowed = true;
    this.totalShippingFee = 0;
    const cart = JSON.parse(localStorage.getItem('cart'));

    if (cart === null) {
      return;
    }
    for (let i = 0; i < cart.length; i++) {
      const item = JSON.parse(cart[i]);
      let _product: Product = item.product;
      this.orderItems.push({
        product: _product,
        quantity: item.quantity
      });
      this.subTotal += _product.price * item.quantity;
      this.totalShippingFee += _product.deliveryFee * item.quantity;

      if (_product.forPickupOnly) {
        this.isShippingAllowed = false;
      }
    }

    let totalBill = this.subTotal;
    if (this.isShippingAllowed) {
      totalBill += this.totalShippingFee;
    }

    // render({
    //   id: "#paypalCheckoutButtons",
    //   currency: "NZD",
    //   value: JSON.parse(JSON.stringify(totalBill/100)),
    //   onApprove: (details) => {
    //     alert("Transaction Successful!");
    //     console.log('Details: ', details);
    //     // TODO: Redirect to order successful page
    //     // Mark order as paid
    //     // Remove items in cart
    //   },
    // });

    paypal.Buttons({
        style: {
          color: 'gold',
          shape: 'rect',
          size: 'small',
          height: 40,
          layout: 'horizontal',
          tagline: 'false'
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                description: 'item description',
                amount: {
                  currency_code: 'NZD',
                  value: JSON.parse(JSON.stringify(totalBill/100))
                }
              }
            ]
          });
        },
        onApprove: async (data, actions) => {
          const order = await actions.order.capture();
    //       // Redirect to order successful page
    //       // Mark order as paid
    //       // Remove items in cart
    // Record info of customers and order
          alert("Transaction successful! " + order);
          console.log('onApprove order: ', order);
        },
        onError: err => {
          console.log('Error: ', err);
          alert("Error: " + err);
        }
      })
      .render(this.paypalElement.nativeElement);

    paypal.Buttons({

      // Show the buyer a 'Pay Now' button in the checkout flow
      commit: false,

      style: {
        color: 'gold',
        shape: 'rect',
        size: 'small',
        height: 40,
        layout: 'horizontal',
        tagline: 'false'
      },

      // payment() is called when the button is clicked
      payment: function(data, actions) {
        // Make a call to the REST API to set up the payment
        return actions.payment.create({
          payment: {
            transactions: [
              {
                amount: { 
                  total: JSON.parse(JSON.stringify(totalBill/100)),
                  currency_code: 'NZD',
                }
              }
            ],
            redirect_urls: {
              return_url: 'http://localhost:4200/order-confirmation',
              cancel_url: '/checkout'
            }
          }
        });
      },

      // onAuthorize() is called when the buyer approves the payment
      onAuthorize: function(data, actions) {

        // Make a call to the REST API to execute the payment
        return actions.payment.execute().then(function() {
          actions.redirect();
        });
      },

      onCancel: function(data, actions) {
        actions.redirect();
      }
    }).render(this.paypalCompleteOrderElement.nativeElement);
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
  }

  continueToPayment() {
    this.onTabClick();
  }

  completeOrder() {
    let isSameAsShippingAddress = this.billingFormGroup.get('sameAsShippingAddress').value;
    let save = this.userInfoFormGroup.get('save').value;
    let subscribe = this.userInfoFormGroup.get('subscribe').value;

    this.userInfoFormGroup.get('country').setValue(this.countries[this.countryIndex]);
    this.userInfoFormGroup.get('region').setValue(this.regions[this.regionIndex]);
    this.userInfoFormGroup.get('city').setValue(this.cities[this.cityIndex]);

    if (!isSameAsShippingAddress) {
      this.billingAddressFormGroup.get('country').setValue(this.countries[this.countryIndex]);
      this.billingAddressFormGroup.get('region').setValue(this.regions[this.regionIndex]);
      this.billingAddressFormGroup.get('city').setValue(this.cities[this.cityIndex]);
    }

    this.customer = this.userInfoFormGroup.value;
    if (save) {
      this.saveCustomerInformation();
    }

    if (subscribe) {
      this.addToSubscriptionList();
    }

    this.createOrder();
  }

  emptyCart() {
    localStorage.removeItem('cart');
  }

  /** Save Customer Information to localStorage */
  saveCustomerInformation() {
    localStorage.setItem('indoorplantsnz_customer', JSON.stringify(this.customer));
  }

  createOrder() {
    const order: Order = new Order();

    order.customer = this.customer;

    let forShipping = this.shippingFormGroup.get('forShipping').value;
    order.paymentMethod = this.paymentFormGroup.get('paymentMethod').value;
    order.orderItems = this.orderItems;

    let shippingDetails = new ShippingDetails();
    if (forShipping) {
      shippingDetails.mode = ShippingFeeMethod.STANDARD;
      shippingDetails.fee = this.totalShippingFee;
    } else {
      shippingDetails.mode = ShippingFeeMethod.PICKUP;
      shippingDetails.fee = 0;
    }
    order.shipping = shippingDetails;

    order.total = this.subTotal + this.totalShippingFee;

    this.orderService.createOrder(order)
    .pipe()
    .subscribe(
      order => {
        this.emptyCart();

        let firstname = this.userInfoFormGroup.get('firstname').value;

        this.router.navigate(['/order-confirmation'], 
          {queryParams: { name: firstname, code: order._id}});
      },
      error => {
        console.log('Error: ', error);
      }
    );
  }

  addToSubscriptionList() {

  }
}
