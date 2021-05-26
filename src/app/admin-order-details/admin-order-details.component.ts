import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, FulfillmentStatus, DiscountMethod, ShippingFeeMethod } from '../_models/order';
import { Customer } from '../_models/customer';
import { Product } from '../_models/product';
import { OrderService } from '../_services/order.service';
import { CustomerService } from '../_services/customer.service';
import { ProductService } from '../_services/product.service';
import { finalize, tap } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import location from '../../assets/cities.json';
import { ProductsComponent } from '../products/products.component';

@Component({
  selector: 'app-admin-order-details',
  templateUrl: './admin-order-details.component.html',
  styleUrls: ['./admin-order-details.component.scss']
})
export class AdminOrderDetailsComponent implements OnInit {

  
  Fulfillment_Status = FulfillmentStatus;
  Payment_Status = PaymentStatus;
  Discount_Method = DiscountMethod;
  Shipping_Fee_Method = ShippingFeeMethod;

  orderActionButtonText: String;
  order: Order = null;
  additionalDetailsFormGroup: FormGroup;
  editOrderContactFormGroup: FormGroup;
  editShippingAddressFormGroup: FormGroup;
  editOrderErrorTitle: string;
  editOrderErrorDesc: string;
  loading: boolean;
  submitted: boolean;
  orderStatuses = OrderStatus;
  paymentMethods = PaymentMethod;
  paymentStatuses = PaymentStatus;
  orderItems: OrderItem[] = [];
  customer: Customer;
  customerOrders: Observable<Order[]>;
  subTotal: number;
  shippingFee: number;
  discountAmount: number = 0;
  totalAmount: number;
  isNewOrder: boolean = false;
  editOrderContactLoading: boolean;
  editOrderContactError: string;
  editShippingAddressLoading: boolean;
  editShippingAddressError: string;
  isFulfillItemsError: boolean = false;

  countries = [];
  regions = [];
  cities = [];
  countryIndex = 0;
  regionIndex = 0;
  cityIndex = 0;

  constructor(
    private orderService: OrderService,
    private customerService: CustomerService,
    private productService: ProductService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.additionalDetailsFormGroup = this.formBuilder.group({
      notes: [{value: '', disabled: true}],
      tags: [{value: '', disabled: true}]
    });

    this.editOrderContactFormGroup = this.formBuilder.group({
      _id: [''],
      email: ['', Validators.required],
      contact: ['', Validators.required],
      apply: [false]
    });

    this.editShippingAddressFormGroup = this.formBuilder.group({
      _id: [''],
      company: [''],
      country: [''],
      region: [''],
      city: [''],
      address: [''],
      postal: [''],
      apply: [false]
    });
  }

  ngOnInit() {
    this.getOrderDetails();
    this.loadCountries();
    this.isNewOrder = this.route.snapshot.queryParams['newOrder'];
  }

  getOrderDetails() {
    const id = this.route.snapshot.paramMap.get('id');
    this.orderService.getOrderById(id)
      .pipe(
        finalize(() => {
          this.computeTotal();
          this.loadShippingAddress(this.customer);
        })
      ).subscribe(
        order => {
          this.order = order;
          this.orderItems = order.orderItems;
          this.customer = order.customer;
          this.customerOrders = this.orderService.getOrdersByCustomerId(this.customer._id).pipe();
          if (order.notes) {
            this.additionalDetailsFormGroup.get('notes').setValue(order.notes);
          }
          if (order.tags) {
            var tagsString = '';
            for (let i=0; i<order.tags.length; i++) {
              tagsString += order.tags[i];
              if (i < order.tags.length - 1) {
                tagsString += ', ';
              }
            }
            this.additionalDetailsFormGroup.get('tags').setValue(tagsString);
          }

          if (this.customer._id) {
            this.editOrderContactFormGroup.get('_id').setValue(this.customer._id);
          }
          this.editOrderContactFormGroup.get('email').setValue(this.customer.email);
          this.editOrderContactFormGroup.get('contact').setValue(this.customer.contact);
        }
      );

    this.submitted = false;
  }

  loadCountries() {
    this.countries = [];
    for (let i=0; i<location.length; i++) {
      this.countries.push(location[i].country);
    }
  }

  loadShippingAddress(customer: Customer) {
    if (customer === null || customer === undefined) {
      return;
    }

    for (let i=0; i<this.countries.length; i++) {
      if (customer.country === this.countries[i]) {
        this.countryIndex = i;
        break;
      }
    }

    this.selectCountry(this.countryIndex);

    for (let i=0; i<this.regions.length; i++) {
      if (customer.region === this.regions[i]) {
        this.regionIndex = i;
        break;
      }
    }

    this.selectRegion(this.regionIndex);

    for (let i=0; i<this.cities.length; i++) {
      if (customer.city === this.cities[i]) {
        this.cityIndex = i;
        break;
      }
    }

    if (customer._id) {
      this.editShippingAddressFormGroup.get('_id').setValue(customer._id);
    }
    this.editShippingAddressFormGroup.get('company').setValue(customer.company);
    this.editShippingAddressFormGroup.get('country').setValue(this.countryIndex);
    this.editShippingAddressFormGroup.get('region').setValue(this.regionIndex);
    this.editShippingAddressFormGroup.get('city').setValue(this.cityIndex);
    this.editShippingAddressFormGroup.get('address').setValue(customer.address);
    this.editShippingAddressFormGroup.get('postal').setValue(customer.postal);
    this.editShippingAddressFormGroup.get('apply').setValue(false);
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

  deleteOrder() {
    const id = this.route.snapshot.paramMap.get('id');
    this.orderService.deleteOrderById(id)
      .subscribe(
        data => {
          this.goBack();
          $('.modal-backdrop').remove();
        }
      );
  }

  cancelOrder() {
    if (this.order.paymentStatus == this.paymentStatuses.PAID &&
      this.order.fulfillmentStatus == this.Fulfillment_Status.FULFILLED) {
      this.editOrderErrorTitle = 'Cancel order failed';
      this.editOrderErrorDesc = 'Cannot cancel an already completed order.';
      $('#cancelOrderModal').modal('hide');
      $('.modal-backdrop').remove();
      return;
    } else {
      this.editOrderErrorTitle = null;
      this.editOrderErrorDesc = null;
    }

    const id = this.route.snapshot.paramMap.get('id');
    this.order.orderStatus = OrderStatus.CANCELED;
    this.orderService.updateOrder(this.order)
      .pipe(
        finalize(() => {
          $('#cancelOrderModal').modal('hide');
          $('.modal-backdrop').remove();
        })
      )
      .subscribe(
        order => {
          // Return stocks to inventory
          for (let orderItem of this.order.orderItems) {
            let soldStock = orderItem.quantity;
            let productId = orderItem.product._id;
            let product = new Product();
            product._id = productId;
            product.stock = orderItem.product.stock + soldStock;
            this.productService.updateProduct(product).pipe().subscribe(
              product => {
                orderItem.product.stock = product.stock;
              }
            );
          }
        },
        error => {
          this.order.orderStatus = OrderStatus.OPEN;
        }
      )
  }

  undoCancelOrder() {
    const id = this.route.snapshot.paramMap.get('id');
    this.order.orderStatus = OrderStatus.OPEN;
    this.orderService.updateOrder(this.order)
      .subscribe(
        order => {
          // Update stocks
          for (let orderItem of this.order.orderItems) {
            let soldStock = orderItem.quantity;
            let productId = orderItem.product._id;
            let product = new Product();
            product._id = productId;
            product.stock = orderItem.product.stock - soldStock;
            this.productService.updateProduct(product).pipe().subscribe(
              product => {
                orderItem.product.stock = product.stock;
              }
            );
          }
        },
        error => {
          this.order.orderStatus = OrderStatus.CANCELED;
        }
      )
  }

  isOrderCanceled() {
    if (this.order) {
      return this.order.orderStatus == OrderStatus.CANCELED;
    }
  }

  isOrderArchived() {
    if (this.order) {
      return this.order.orderStatus == OrderStatus.ARCHIVED;
    }
  }

  goBack() {
    this.location.back();
  }

  markAsPaid() {
    const order = new Order();
    order._id = this.order._id;
    order.paymentStatus = this.Payment_Status.PAID;

    this.orderService.updateOrder(order)
      .pipe()
      .subscribe(
        order => {
          this.order = order;
          this.editOrderErrorTitle = null;
          this.editOrderErrorDesc = null;
          this.isFulfillItemsError = null;
        },
        error => {
          this.editOrderErrorTitle = 'Failed to mark order as paid';
          this.editOrderErrorDesc = error;
        }
      );
  }

  fulfillItems() {
    if (this.order.paymentStatus == this.Payment_Status.PENDING) {
      this.isFulfillItemsError = true;
      return;
    }
    this.fulfillOrder();
  }

  fulfillOrder() {
    this.isFulfillItemsError = false;

    const order = new Order();
    order._id = this.order._id;
    order.fulfillmentStatus = this.Fulfillment_Status.FULFILLED;
    this.orderService.updateOrder(order)
      .pipe()
      .subscribe(
        order => {
          this.order = order;
          this.editOrderErrorTitle = null;
          this.editOrderErrorDesc = null;
        },
        error => {
          this.editOrderErrorTitle = 'Fulfill order items failed';
          this.editOrderErrorDesc = error;
        }
      );
  }

  editOrderContact() {
    this.editOrderContactLoading = true;
    const apply = this.editOrderContactFormGroup.get('apply').value;

    if (this.customer._id) {
      var customer = new Customer();
      customer._id = this.editOrderContactFormGroup.get('_id').value;
      customer.email = this.editOrderContactFormGroup.get('email').value;
      customer.contact = this.editOrderContactFormGroup.get('contact').value;

      this.customerService.updateCustomer(customer)
        .pipe()
        .subscribe(
          updated_customer => {
            this.customer = updated_customer;
            this.editOrderContactError = null;
            $('#editOrderContactModal').modal('hide');
            $('.modal-backdrop').remove();
          },
          error => {
            this.editOrderContactError = 'Customer with that email already exists';
          }
        );
    }
    
    if (apply && this.customer._id) {
      this.orderService.getOrdersByCustomerId(this.customer._id)
        .pipe(
          tap((orders) => {
            for (let order of orders) {
              order.customer.email = this.editOrderContactFormGroup.get('email').value;
              order.customer.contact = this.editOrderContactFormGroup.get('contact').value;
              this.orderService.updateOrder(order).pipe().subscribe();
            }
          }),
          finalize(() => {
            this.editOrderContactLoading = false;
            $('#editOrderContactModal').modal('hide');
            $('.modal-backdrop').remove();
          })
        )
        .subscribe();
    } else {
      this.order.customer.email = this.editOrderContactFormGroup.get('email').value;
      this.order.customer.contact = this.editOrderContactFormGroup.get('contact').value;
      this.orderService.updateOrder(this.order)
        .pipe(
          finalize(() => {
            this.editOrderContactLoading = false;
            $('#editOrderContactModal').modal('hide');
            $('.modal-backdrop').remove();
          })
        )
        .subscribe();
    }
  }

  editShippingAddress() {
    this.editShippingAddressLoading = true;
    var customer = new Customer();
    var company = this.editShippingAddressFormGroup.get('company').value
    var address = this.editShippingAddressFormGroup.get('address').value
    var country = this.countries[this.countryIndex];
    var region = this.regions[this.regionIndex];
    var city = this.cities[this.cityIndex];
    var postal = this.editShippingAddressFormGroup.get('postal').value;

    customer._id = this.editShippingAddressFormGroup.get('_id').value;
    customer.company = company;
    customer.address = address;
    customer.country = country;
    customer.region = region;
    customer.city = city;
    customer.postal = postal;
    const apply = this.editShippingAddressFormGroup.get('apply').value;

    if (customer._id) {
      this.customerService.updateCustomer(customer)
        .pipe(finalize(() => {
          this.editShippingAddressLoading = false;
        }))
        .subscribe(
          updated_customer => {
            this.customer = updated_customer;
            this.editShippingAddressError = null;
            $('#editShippingAddressModal').modal('hide');
            $('.modal-backdrop').remove();
          },
          error => {
            this.editShippingAddressError = error;
          }
        );
    }
    
    if (apply && customer._id) {
      this.orderService.getOrdersByCustomerId(customer._id)
        .pipe(
          tap((orders) => {
            for (let order of orders) {
              order.customer.company = company;
              order.customer.address = address;
              order.customer.country = country;
              order.customer.region = region;
              order.customer.city = city;
              order.customer.postal = postal;
              this.orderService.updateOrder(order).pipe().subscribe();
            }
          }),
          finalize(() => {
            this.editShippingAddressLoading = false;
            $('#editShippingAddressModal').modal('hide');
            $('.modal-backdrop').remove();
          })
        ).subscribe();
    } else {
      this.order.customer.company = company;
      this.order.customer.address = address;
      this.order.customer.country = country;
      this.order.customer.region = region;
      this.order.customer.city = city;
      this.order.customer.postal = postal;
      this.orderService.updateOrder(this.order)
        .pipe(
          finalize(() => {
            this.editShippingAddressLoading = false;
            $('#editShippingAddressModal').modal('hide');
            $('.modal-backdrop').remove();
          })
        ).subscribe();
    }
  }

  applyDiscount() {
    if (this.order.discount) {
      if (this.order.discount.mode == DiscountMethod.DOLLAR) {
        this.discountAmount = this.order.discount.discount * 100;
      } else if (this.order.discount.mode == DiscountMethod.PERCENT) {
        this.discountAmount = (this.order.discount.discount/100) * this.subTotal;
      }
    }
  }

  computeTotal() {
    this.subTotal = 0;
    this.totalAmount = 0;
    this.shippingFee = this.order.shipping.fee;

    for (let i = 0; i < this.orderItems.length; i++) {
      this.subTotal += this.orderItems[i].product.price * this.orderItems[i].quantity;
    }

    if (this.order.discount) {
      this.applyDiscount();
    }

    this.totalAmount = this.subTotal + this.shippingFee - this.discountAmount;
  }

  archiveOrder() {
    this.orderService.archiveOrder(this.order._id)
      .pipe()
      .subscribe(
        orders => {
          this.getOrderDetails();
        }
      );
  }

  unarchiveOrder() {
    this.orderService.unarchiveOrder(this.order._id)
      .pipe()
      .subscribe(
        orders => {
          this.getOrderDetails();
        }
      );
  }

}
