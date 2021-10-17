import { isMetadataImportedSymbolReferenceExpression } from '@angular/compiler-cli';
import { Component, ElementRef, OnDestroy, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderItem, Order, PaymentMethod, ShippingDetails, ShippingFeeMethod, PaymentStatus } from '../_models/order';
import { Customer } from '../_models/customer';
import { Product } from '../_models/product';
import { CustomerService } from '../_services/customer.service';
import { OrderService } from '../_services/order.service';
import { ProductService } from '../_services/product.service';
import { SettingsService } from '../_services/settings.service';
import { SendMailService } from '../_services/send-mail.service';
import location from '../../assets/cities.json';
import { finalize, tap } from 'rxjs/operators';
import { Settings } from '../_models/settings';
import { ContentService } from '../_services/content.service';
import { Content } from '../_models/content';
import { OrderTransaction, OrderTransactionType } from 'app/_models/ordertransaction';
import { OrderTransactionService } from 'app/_services/order-transaction.service';

declare const clickTab: any;
declare var paypal;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {

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

  itemList = [];
  itemTotal = 0;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private orderService: OrderService,
    private productService: ProductService,
    private settingsService: SettingsService,
    private contentService: ContentService,
    private sendMailService: SendMailService,
    private orderTransactionService: OrderTransactionService,
    private zone: NgZone
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
      forShipping: [true]
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

    // this.paymentFormGroup.get('paymentMethod').valueChanges.subscribe(method => {
    //   let element = document.querySelector<HTMLElement>('#paypalCompleteOrderButton');
    //   if (method === PaymentMethod.PAYPAL) {
    //     element.style.display = 'inline-block';
    //   } else {
    //     element.style.display = 'none';
    //   }
    // });
  }

  ngOnInit() {
    this.getSettings();
    this.loadCart();
    this.loadCountries();
    this.getContent();
    // if (this.paymentFormGroup.get('paymentMethod').value == PaymentMethod.PAYPAL) {
    //   document.querySelector<HTMLElement>('#paypalCompleteOrderButton').style.display = 'inline-block';
    // } else {
    //   document.querySelector<HTMLElement>('#paypalCompleteOrderButton').style.display = 'none';
    // }
  }

  ngOnDestroy() {
    if (this.paypalButton != undefined || this.paypalButton != null) {
      this.paypalButton.close();
    }
  }
  
  onTabClick() {
    clickTab();
  }

  getSettings(): void {
    this.settingsService.getSettings()
      .pipe(tap(settings => {
        this.settings = settings;
        this.shippingFormGroup.get('forShipping').setValue(!this.settings.allowPickup);

        if (settings.acceptCash) {
          this.paymentFormGroup.get('paymentMethod').setValue(PaymentMethod.CASH);
        } else if (settings.acceptPaypal) {
          this.paymentFormGroup.get('paymentMethod').setValue(PaymentMethod.PAYPAL);
        } else if (settings.acceptBankTransfer) {
          this.paymentFormGroup.get('paymentMethod').setValue(PaymentMethod.BANK_TRANSFER);
        }
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
    this.itemTotal = 0;
    this.itemList = [];
    let totalBill = 0;
    let cart = localStorage.getItem('cart');
    if (cart) {
      cart = JSON.parse(cart);
    } else {
      return;
    }

    for (let i = 0; i < cart.length; i++) {
      let item = JSON.parse(cart[i]);
      this.productService.getProductById(item.product)
        .pipe(finalize(() => {
          if (this.itemList.length == cart.length) {
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

            let orderItem = {
              name: prod.name,
              quantity: item.quantity,
              unit_amount: {value: prod.price/100, currency_code: 'NZD'}
            };

            this.itemTotal += item.quantity;

            this.itemList.push(orderItem);
            
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
      shipping = (this.totalShippingFee + this.baseShippingFee) / 100;
    }

    let tempSubTotal = 0;

    for (let i=0; i<this.itemList.length; i++) {
      tempSubTotal += this.itemList[i].unit_amount.value * this.itemList[i].quantity;
    }

    let totalBill = tempSubTotal + shipping;

    if (this.paypalButton != undefined || this.paypalButton != null) {
      this.paypalButton.close();
    }

    this.paypalButton = paypal.Buttons({

      // Show the buyer a 'Pay Now' button in the checkout flow
      commit: true,

      style: {
        color: 'blue',
        shape: 'rect',
        size: 'large',
        layout: 'vertical',
        tagline: 'false'
      },

      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                currency_code: 'NZD',
                value: JSON.parse(JSON.stringify(totalBill)),
                breakdown: {
                  item_total: {value: tempSubTotal, currency_code: 'NZD'},
                  shipping: {value: shipping, currency_code: 'NZD'}
                }
              },
              items: this.itemList
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
        if (order.status == "COMPLETED") {
          this.displayLoading();
          this.completeOrder();
        }
      },

      onCancel: function(data, actions) {
        console.log('onCancel() data: ', data);
      },

      onError: function(data, actions){
        console.log('onError() data: ', data);
      }
    });

    this.paypalButton.render('#paypalCompleteOrderButton');

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
    
    this.setBaseShippingFee();

    for (let i=0; i<data.length; i++) {
      this.cities.push(data[i]);
    }
  }

  selectCity(cityIndex) {
    this.cityIndex = cityIndex;
  }

  setBaseShippingFee() {
    let island = location[this.countryIndex].regions[this.regionIndex].island;

    if (island === "North Island") {
      this.baseShippingFee = this.settings.northIslandShippingRate;
    } else if (island === "South Island") {
      this.baseShippingFee = this.settings.southIslandShippingRate;
    }
  }

  continueToShipping() {
    this.onTabClick();
    this.setBaseShippingFee();
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
        this.createOrderTransaction(order, OrderTransactionType.ORDER_CREATED);
        this.createOrderTransaction(order, OrderTransactionType.PAYMENT_RECEIVED);
        this.sendConfirmationEmail(order);
        this.removeLoading();
        this.zone.run(() => {
          this.router.navigate(['/order-confirmation'], 
            {queryParams: { orderId: order._id}});
        });
      },
      error => {
        console.log('Error: ', error);
      }
    );
  }

  sendConfirmationEmail(order) {
    order.orderItems = this.orderItems;
    order.url = window.location.origin + '/order-confirmation?orderId=' + order._id;
    this.sendMailService.sendOrderConfirmationMail(order)
      .pipe()
      .subscribe(
        success => {
          // Todo: Mark order property - emailSent

          console.log('Successfully sent order confirmation email');
        },
        error => {
          console.log('Failed to send order confirmation email: ', error);
        }
      );
  }

  createOrderTransaction(order: Order, type: string) {
    const orderTotal = (order.total/100).toFixed(2);
    let transaction = new OrderTransaction();
    transaction.orderId = order._id;
    transaction.type = type;
    
    switch(type) {
      case OrderTransactionType.ORDER_CREATED:
        transaction.summary = `Order created by customer thru website`;
        break;
      case OrderTransactionType.PAYMENT_RECEIVED:
        transaction.summary = `Payment of NZD ${orderTotal} was accepted thru ${order.paymentMethod}`;
        break;
      default:
        break;
    }
    this.orderTransactionService.addOrderTransaction(transaction)
      .pipe()
      .subscribe();
  }

  displayLoading() {
    window.scroll(0, 0);
    $('#loadingModal').modal('show');
  }

  removeLoading() {
    $('#loadingModal').modal('hide');
    $('.modal-backdrop').remove();
  }

  addToSubscriptionList() {

  }
}
