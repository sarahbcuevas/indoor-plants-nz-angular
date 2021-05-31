import { isMetadataImportedSymbolReferenceExpression } from '@angular/compiler-cli';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderItem, Order, PaymentMethod, ShippingDetails, ShippingFeeMethod, PaymentStatus } from '../_models/order';
import { Customer } from '../_models/customer';
import { Product } from '../_models/product';
import { CustomerService } from '../_services/customer.service';
import { OrderService } from '../_services/order.service';
import { ProductService } from '../_services/product.service';
import { SettingsService } from '../_services/settings.service';
import location from '../../assets/cities.json';
import { finalize, tap } from 'rxjs/operators';
import { render } from 'creditcardpayments/creditCardPayments';
import { Settings } from '../_models/settings';
import { ContentService } from '../_services/content.service';
import { Content } from '../_models/content';

declare const clickTab: any;
declare var paypal;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
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
  baseShippingFee: number = 0;
  customer: Customer;
  isShippingAllowed: boolean;
  Payment_Method = PaymentMethod;
  settings: Settings;
  paypalButton: any;
  content: Content;
  forShipping: boolean;
  isShippingStep = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private orderService: OrderService,
    private productService: ProductService,
    private settingsService: SettingsService,
    private contentService: ContentService
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
      paymentMethod: ['', Validators.required]
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
    this.getSettings();
    this.loadCart();
    this.loadCountries();
    this.getContent();
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

  getSettings(): void {
    this.settingsService.getSettings()
      .pipe(tap(settings => {
        this.settings = settings;
        this.shippingFormGroup.get('forShipping').setValue(!this.settings.allowPickup);
      }))
      .subscribe();
  }
  
  getContent() {
    this.contentService.getContent()
      .subscribe(
        content => {
          this.content = content[0];
          if (this.content) {
            document.title = this.content.shopName;
          }
        }
      );
  }

  loadCart() {
    this.subTotal = 0;
    this.orderItems = [];
    this.isShippingAllowed = true;
    this.totalShippingFee = 0;
    let totalBill = 0;
    const cart = JSON.parse(localStorage.getItem('cart'));

    if (cart === null) {
      return;
    }

    for (let i = 0; i < cart.length; i++) {
      const item = JSON.parse(cart[i]);
      this.productService.getProductById(item.product)
        .pipe(finalize(() => {
          if (i == cart.length - 1) {
            totalBill = this.subTotal;
            if (this.isShippingAllowed) {
              totalBill += this.totalShippingFee + this.baseShippingFee;
            }

            this.renderPaypalButton();
          }
        }))
        .subscribe(
          prod => {
            this.orderItems.push({
              product: prod,
              quantity: item.quantity
            });
            
            this.subTotal += prod.price * item.quantity;
            this.totalShippingFee += prod.deliveryFee * item.quantity;

            if (prod.forPickupOnly && this.settings.allowPickup) {
              this.isShippingAllowed = false;
            }
          }
        );
    }
  }

  renderPaypalButton() {

    this.forShipping = this.shippingFormGroup.get('forShipping').value;
    let shipping = 0;

    if (this.forShipping) {
      shipping = this.totalShippingFee + this.baseShippingFee;
    }

    let totalBill = this.subTotal + shipping;

    let itemList = [];
    let itemTotal = 0;
    
    this.orderItems.forEach(order => {
      let item = {
        name: order.product.name,
        quantity: order.quantity,
        unit_amount: {value: order.product.price/100, currency_code: 'NZD'}
      };
      itemTotal += order.quantity;
      console.log(`${order.product.name}: ${order.product.price} x ${order.quantity} = ${order.product.price * order.quantity} `);

      itemList.push(item);
    });

    if (this.paypalButton != undefined || this.paypalButton != null) {
      this.paypalButton.close();
    }

    console.log('totalBill: ', totalBill);
    console.log('shipping: ', shipping);

    this.paypalButton = paypal.Buttons({

      // Show the buyer a 'Pay Now' button in the checkout flow
      commit: true,

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
              amount: {
                currency_code: 'NZD',
                value: JSON.parse(JSON.stringify(totalBill/100)),
                breakdown: {
                  item_total: {value: this.subTotal/100, currency_code: 'NZD'},
                  shipping: {value: shipping/100, currency_code: 'NZD'}
                }
              },
              items: itemList
            }
          ],
          application_context: {
            shipping_preference: 'NO_SHIPPING'
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

      onApprove: async (data, actions) => {
        const order = await actions.order.capture();
        // Redirect to order successful page
        // Mark order as paid
        // Remove items in cart
        // Record info of customers and order
        if (order.status == "COMPLETED") {
          this.completeOrder();
        }
      },

      onCancel: function(data, actions) {
        console.log('onCancel() data: ', data);
      }
    });

    this.paypalButton.render(this.paypalCompleteOrderElement.nativeElement);

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
    let island = location[this.countryIndex].regions[regionIndex].island;

    if (island === "North Island") {
      this.baseShippingFee = this.settings.northIslandShippingRate;
    } else if (island === "South Island") {
      this.baseShippingFee = this.settings.southIslandShippingRate;
    }

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
    $('#removeProductModal').hide();
    $('.modal-backdrop').remove();
  }

  continueToShipping() {
    this.onTabClick();
    this.isShippingStep = true;
  }

  continueToPayment() {
    this.loadCart();
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
      shippingDetails.fee = this.totalShippingFee + this.baseShippingFee;
    } else {
      shippingDetails.mode = ShippingFeeMethod.PICKUP;
      shippingDetails.fee = 0;
    }
    order.shipping = shippingDetails;

    if (order.paymentMethod == PaymentMethod.PAYPAL) {
      order.paymentStatus = PaymentStatus.PAID;
    }

    order.total = this.subTotal + shippingDetails.fee;

    this.orderService.createOrder(order)
    .pipe()
    .subscribe(
      order => {
        this.emptyCart();

        this.router.navigate(['/order-confirmation'], 
          {queryParams: { orderId: order._id}});
      },
      error => {
        console.log('Error: ', error);
      }
    );
  }

  addToSubscriptionList() {

  }
}
