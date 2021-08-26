import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { OrderItem, Order, PaymentMethod, PaymentStatus, OrderStatus, FulfillmentStatus, DiscountMethod, OrderDiscount, ShippingFeeMethod, ShippingDetails } from '../_models/order';
import { ProductService } from '../_services/product.service';
import { OrderTransactionService } from 'app/_services/order-transaction.service';
import { CustomerService } from '../_services/customer.service';
import { OrderService } from '../_services/order.service';
import { UserService } from 'app/_services/user.service';
import { Product } from '../_models/product';
import { Customer } from '../_models/customer';
import { User } from '../_models/user';
import { Observable, of } from 'rxjs';
import { finalize, tap, map, filter } from 'rxjs/operators/';
import location from '../../assets/cities.json';
import { Router } from '@angular/router';
import { OrderTransaction, OrderTransactionType } from 'app/_models/ordertransaction';

export class Tag {
  name: string;
  selected: boolean;
}

export class SelectedTag {
  name: string;
  indexInAllTags: number; // index in AllTags or -1 if not in AllTags
}

@Component({
  selector: 'app-admin-order-create',
  templateUrl: './admin-order-create.component.html',
  styleUrls: ['./admin-order-create.component.scss']
})

export class AdminOrderCreateComponent implements OnInit {

  orderFormGroup: FormGroup;
  addDiscountFormGroup: FormGroup;
  addShippingFormGroup: FormGroup;
  createCustomerFormGroup: FormGroup;
  editCustomerFormGroup: FormGroup;
  editShippingAddressFormGroup: FormGroup;
  orderItems: OrderItem[] = [];
  products: Observable<Product[]>;
  customers: Observable<Customer[]>;
  isProductsLoading: boolean;
  isCustomersLoading: boolean;
  selectedProducts = [];
  subTotal = 0;
  originalSubTotal = 0;
  baseShippingFee = 0;
  totalShippingFee = 0;
  totalBill = 0;
  tagsInput: string;
  allTags: Tag[] = [];
  selectedTags: SelectedTag[] = [];
  selectedTagsDraft: SelectedTag[] = [];
  notes: string = '';
  PAYMENT_STATUS = PaymentStatus;
  paymentStatus = null;
  currentUser: User;

  // Discount Methods
  DISCOUNT_METHOD = DiscountMethod;

  Shipping_Fee_Method = ShippingFeeMethod;
  shippingFeeMethod = ShippingFeeMethod.STANDARD;
  customShippingName: string;

  discountMethod = DiscountMethod.DOLLAR;
  discountInput = 0;
  discountReason: string;
  addDiscountError: string = '';
  addShippingError: string = '';

  countries = [];
  regions = [];
  cities = [];
  countryIndex = -1;
  regionIndex = -1;
  cityIndex = -1;
  createCustomerError: string;
  createCustomerSubmitted: boolean;
  createCustomerLoading: boolean;
  selectedCustomer: any = null;;
  selectedCustomerOrders: Observable<Order[]>;

  editCustomerLoading: boolean;
  editCustomerError: string;

  editShippingAddressLoading: boolean;
  editShippingAddressError: string;

  createOrderError: string = null;
  createOrderLoading: boolean;

  orderDiscount: OrderDiscount;

  // SORT TAGS
  ALPHABETICALLY = 'alphabetically';
  POPULARITY = 'popularity';
  sortTagsMethod = this.ALPHABETICALLY;

  constructor(
    private location: Location,
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private customerService: CustomerService,
    private orderService: OrderService,
    private userService: UserService,
    private router: Router,
    private orderTransactionService: OrderTransactionService
  ) {
    this.orderFormGroup = this.formBuilder.group({
      customer: ['', Validators.required],
      shippingFee: [0, Validators.required],
      orderStatus: [OrderStatus.OPEN, Validators.required],
      paymentMethod: [PaymentMethod.CASH, Validators.required],
      paymentStatus: ['', Validators.required],
      fulfillmentStatus: [FulfillmentStatus.UNFULFILLED, Validators.required],
      notes: ['']
    });

    this.addDiscountFormGroup = this.formBuilder.group({
      discount: ['0', Validators.required],
      reason: ['']
    });

    this.addShippingFormGroup = this.formBuilder.group({
      shippingFeeMethod: [ShippingFeeMethod.STANDARD, Validators.required],
      customName: [''],
      shipping: ['0', Validators.required]
    });

    this.createCustomerFormGroup = this.formBuilder.group({
      email: [''],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      contact: [''],
      company: [''],
      country: [''],
      region: [''],
      city: [''],
      address: [''],
      postal: [''],
      subscribe: [false]
    });

    this.editCustomerFormGroup = this.formBuilder.group({
      _id: ['', Validators.required],
      email: [''],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      contact: ['']
    });

    this.editShippingAddressFormGroup = this.formBuilder.group({
      _id: ['', Validators.required],
      company: [''],
      country: [''],
      region: [''],
      city: [''],
      address: [''],
      postal: ['']
    });

    this.orderDiscount = new OrderDiscount();
  }

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadProducts();
    this.loadCustomers();
    this.loadCountries();
    this.loadAllTags();
  }

  getCurrentUser() {
    this.userService.getCurrentUser()
      .subscribe(
        data => {
          this.currentUser = data;
        }
      );
  }

  goBack() {
    this.location.back();
  }

  loadProducts() {
    this.isProductsLoading = true;
    this.products = this.productService.getProducts()
      .pipe(
        map((products) => {
          return products.filter(prod => {
            return !this.isProductSelected(prod._id)
          })
        }),
        finalize(() => {
          this.isProductsLoading = false;
        }
      ));
      
  }

  loadCustomers() {
    this.isCustomersLoading = true;
    this.customers = this.customerService.getCustomers()
      .pipe(
        finalize(() => {
          this.isCustomersLoading = false;
        })
      );
  }

  loadCountries() {
    this.countries = [];
    for (let i=0; i<location.length; i++) {
      this.countries.push(location[i].country);
    }
  }

  loadAllTags() {
    this.allTags = [];
    this.orderService.getAllTags()
      .pipe()
      .subscribe(
        tags => {
          for (let tag of tags) {
            this.allTags.push({
              name: tag,
              selected: false
            });
          }
        }
      );
  }

  sortTags(sortMethod) {
    this.sortTagsMethod = sortMethod;

    this.allTags = this.allTags.sort((a, b) => {
      switch (this.sortTagsMethod) {
        case this.ALPHABETICALLY:
          if (a.name < b.name) {
            return -1;
          } else if (a.name > b.name) {
            return 1;
          }
          return 0;
        case this.POPULARITY:
          var a_count = 0;
          var b_count = 0;
          this.orderService.getOrders()
            .pipe(
              tap((orders) => {
                orders.forEach(order => {
                  if (order.tags.includes(a.name)) {
                    a_count++;
                  }
                  if (order.tags.includes(b.name)) {
                    b_count++;
                  }
                });

                console.log(a.name + ': ' + a_count);
                if (a_count < b_count) {
                  return -1;
                } else if (a_count > b_count) {
                  return 1;
                }
                return 0;
              })
            );
      }

    }
    );
  }

  selectProduct(product:Product) {
    var orderItem = new OrderItem();
    orderItem.product = product;
    orderItem.quantity = 1;
    this.orderItems.push(orderItem);
    this.selectedProducts.push(product._id);
    this.loadProducts();
    this.calculateBill();
  }

  unselectProduct(i:number, product:Product) {
    this.orderItems.splice(i, 1);
    this.selectedProducts.splice(this.selectedProducts.indexOf(product._id), 1);
    this.loadProducts();
    this.calculateBill();
  }

  isProductSelected(id) {
    return this.selectedProducts.indexOf(id) != -1;
  }

  calculateBill() {
    this.subTotal = 0
    this.baseShippingFee = 0;
    this.totalBill = 0;
    for (let i=0; i<this.orderItems.length; i++) {
      if (!this.orderItems[i].product.forPickupOnly) {
        this.baseShippingFee += (this.orderItems[i].product.deliveryFee * this.orderItems[i].quantity);
      }
      this.subTotal += (this.orderItems[i].product.price * this.orderItems[i].quantity);
    }

    this.originalSubTotal = this.subTotal;

    if (this.shippingFeeMethod == ShippingFeeMethod.STANDARD) {
      this.totalShippingFee = this.baseShippingFee;
    }

    this.totalBill = this.subTotal + this.totalShippingFee;

    if (this.discountInput > 0) {
      this.applyDiscount();
    }

    if (this.totalBill <= 0) {
      this.createOrderError = 'Total bill should be positive.';
    } else {
      this.createOrderError = null;
    }
  }

  setDiscountMethod(discountMethod: string) {
    this.discountMethod = discountMethod;

    if (discountMethod == DiscountMethod.DOLLAR) {
      $('#discountDollar').addClass('active');
    } else {
      $('#discountDollar').removeClass('active');
    }
    if (discountMethod == DiscountMethod.PERCENT) {
      $('#discountPercent').addClass('active');
    } else {
      $('#discountPercent').removeClass('active');
    }
  }

  closeDiscountPopup() {
    this.addDiscountError = '';
  }

  applyDiscount() {

    if (this.orderItems.length == 0) {
      this.addDiscountError = 'Please select products first.';
      return;
    }

    this.discountInput = this.addDiscountFormGroup.get('discount').value;
    this.discountReason = this.addDiscountFormGroup.get('reason').value;

    if (this.discountInput <= 0 || this.discountInput == null) {
      this.addDiscountError = 'Discount amount invalid.';
    }

    if (this.discountMethod == DiscountMethod.DOLLAR) {
      if ((this.discountInput * 100) > this.originalSubTotal) {
        this.addDiscountError = 'Discount should be less than the total bill.';
        return;
      }
      this.subTotal = this.originalSubTotal - (this.discountInput*100);
      this.totalBill = this.subTotal + this.totalShippingFee;
      this.addDiscountError = '';
    }
    else if (this.discountMethod == DiscountMethod.PERCENT) {
      if (this.discountInput > 100) {
        this.addDiscountError = 'Percent discount should not be more than 100%';
        return;
      }
      this.subTotal = this.originalSubTotal * ((100 - this.discountInput)/100);
      this.totalBill = this.subTotal + this.totalShippingFee;
      this.addDiscountError = '';
    }

    if (this.totalBill <= 0) {
      this.createOrderError = 'Total bill should be positive.';
    } else {
      this.createOrderError = null;
    }

    $('#addDiscountPopup').hide();
    $('.modal-backdrop').remove();
  }

  updateShippingFee() {
    this.shippingFeeMethod = this.addShippingFormGroup.get('shippingFeeMethod').value;
    this.customShippingName = null;

    if (this.shippingFeeMethod == ShippingFeeMethod.STANDARD) {
      this.totalShippingFee = this.baseShippingFee;
    } else if (this.shippingFeeMethod == ShippingFeeMethod.FREE) {
      this.totalShippingFee = 0;
    } else if (this.shippingFeeMethod == ShippingFeeMethod.CUSTOM) {
      this.customShippingName = this.addShippingFormGroup.get('customName').value;
      var shipping = this.addShippingFormGroup.get('shipping').value;

      if (shipping <= 0 || shipping == null) {
        this.addShippingError = 'Please input valid shipping fee.'
        return;
      }
      this.totalShippingFee = shipping * 100;
    } else if (this.shippingFeeMethod == ShippingFeeMethod.PICKUP) {
      this.totalShippingFee = 0;
    }

    this.addShippingError = '';

    $('#addShippingPopup').hide();
    $('.modal-backdrop').remove();

    this.calculateBill();
  }

  selectCountry(countryIndex) {
    if (countryIndex < 0) {
      return;
    }
    this.regions = [];
    this.countryIndex = countryIndex;
    let data = location[countryIndex].regions;
    for (let i=0; i<data.length; i++) {
      this.regions.push(data[i].name);
    }
  }

  selectRegion(regionIndex) {
    if (regionIndex < 0) {
      return;
    }
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

  createCustomer() {
    event.preventDefault();
    this.createCustomerError = null;
    this.createCustomerSubmitted = true;
    // stop here if form is invalid
    if (this.createCustomerFormGroup.invalid) {
      return;
    }

    this.createCustomerLoading = true;
    var customer:Customer = this.createCustomerFormGroup.value;
    if (this.countryIndex >= 0 && this.regionIndex >= 0 && this.cityIndex >= 0) {
      customer.country = this.countries[this.countryIndex];
      customer.region = this.regions[this.regionIndex];
      customer.city = this.cities[this.cityIndex];
    } else {
      customer.country = '';
      customer.region = '';
      customer.city = '';
    }

    this.customerService.createCustomer(customer)
      .pipe(finalize(() => {
        this.createCustomerLoading = false;        
      }))
      .subscribe(
        customer => {
          this.selectCustomer(customer);
          $('#createCustomerModal').hide();
          $('.modal-backdrop').remove();
          this.createCustomerFormGroup.reset();
          this.createCustomerSubmitted = false;
          this.createCustomerError = null;
          this.loadCustomers();
        },
        error => {
          this.createCustomerError = 'Customer with that email already exists.';
        }
      );
  }

  selectCustomer(customer) {
    this.selectedCustomer = customer;
    this.selectedCustomerOrders = this.orderService.getOrdersByCustomerId(customer._id).pipe();
    
    this.editCustomerFormGroup.setValue({
      _id: customer._id,
      firstname: customer.firstname,
      lastname: customer.lastname,
      email: customer.email,
      contact: customer.contact
    });

    this.loadShippingAddress(customer);

  }

  deselectCustomer() {
    this.selectedCustomer = null;
    this.countryIndex = 0;
    this.regionIndex = 0;
    this.cityIndex = 0;
  }

  editCustomer() {
    this.editCustomerLoading = true;
    var customer: Customer = this.editCustomerFormGroup.value;
    this.customerService.updateCustomer(customer)
      .pipe(finalize(() => {
        this.editCustomerLoading = false;
      }))
      .subscribe(
        updated_customer => {
          this.selectedCustomer = updated_customer;
          this.editCustomerError = null;
          $('#editCustomerModal').hide();
          $('.modal-backdrop').remove();
        },
        error => {
          this.editCustomerError = 'Customer with that email already exists';
        }
      );
  }

  editShippingAddress() {
    this.editShippingAddressLoading = true;
    var customer:Customer = this.editShippingAddressFormGroup.value;
    customer.country = this.countries[this.countryIndex];
    customer.region = this.regions[this.regionIndex];
    customer.city = this.cities[this.cityIndex];

    this.customerService.updateCustomer(customer)
      .pipe(finalize(() => {
        this.editShippingAddressLoading = false;
      }))
      .subscribe(
        updated_customer => {
          this.selectedCustomer = updated_customer;
          this.editShippingAddressError = null;
          $('#editShippingAddressModal').hide();
          $('.modal-backdrop').remove();
        },
        error => {
          this.editShippingAddressError = error;
        }
      );
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

    this.editShippingAddressFormGroup.setValue({
      _id: customer._id,
      company: customer.company,
      country: this.countryIndex,
      region: this.regionIndex,
      city: this.cityIndex,
      address: customer.address,
      postal: customer.postal
    });
  }

  onKeyPress(event: KeyboardEvent) {
    const inputChar = event.code;

    if (inputChar == 'Enter' || inputChar == 'NumpadEnter') {
      const tag = JSON.parse(JSON.stringify(this.tagsInput));
      this.addNewTag(tag);
      this.tagsInput = null;
      this.tagsInput = '';
    }
  }

  // Method to select an existing tag (from allTags array)
  // name     tag name
  // index    index in allTags array
  addSelectedTag(name: string, index: number) {
    const newTag = new SelectedTag();
    newTag.name = name;
    newTag.indexInAllTags = index;
    this.selectedTags.push(newTag);

    if (index >= 0) {
      this.allTags[index].selected = true;
    }
  }

  // Method to "draft select" a tag from allTags array
  addDraftSelectedTag(name: string, index: number) {
    const newTag = new SelectedTag();
    newTag.name = name;
    newTag.indexInAllTags = index;
    this.selectedTagsDraft.push(newTag);

    if (index >= 0) {
      this.allTags[index].selected = true;
    }
  }

  // Method to add a new tag that does not exist yet
  addNewTag(name: string) {
    // If a selected tag of the same name already exists, do not add anymore.
    for (let tag of this.selectedTags) {
      if (tag.name == name) {
        return;
      }
    }
    // Check if tag name does not exist yet in allTags. If it exists, select that tag instead of creating new one.
    // for (let tag of this.allTags; let i=index) {
    for (let i=0; i<this.allTags.length; i++) {
      if (this.allTags[i].name == name) {
        this.addSelectedTag(name, i);
        return;
      }
    }
    this.addSelectedTag(name, -1);
  }

  duplicateSelectedTag(origin: SelectedTag[], dest: SelectedTag[]) {
    dest = [];
    for (let tag of origin) {
      const duplicate = JSON.parse(JSON.stringify(tag));
      dest.push(duplicate);
    }

    return dest;
  }

  removeSelectedTag(tags: SelectedTag[], index: number) {
    var removedTag = tags.splice(index, 1);
    if (removedTag[0].indexInAllTags >= 0) {
      this.allTags[removedTag[0].indexInAllTags].selected = false;
    }
  }

  applyTags() {
    this.selectedTags = this.duplicateSelectedTag(this.selectedTagsDraft, this.selectedTags);
    this.selectedTagsDraft = [];

    $('#viewAllTagsModal').hide();
    $('.modal-backdrop').remove();
  }

  initializeSelectedTagsDraft() {
    this.selectedTagsDraft = this.duplicateSelectedTag(this.selectedTags, this.selectedTagsDraft);
  }

  markAsPaid() {
    this.orderFormGroup.get('paymentStatus').setValue(PaymentStatus.PAID);
    this.paymentStatus = PaymentStatus.PAID;
  }

  markAsPending() {
    this.orderFormGroup.get('paymentStatus').setValue(PaymentStatus.PENDING);
    this.paymentStatus = PaymentStatus.PENDING;
  }

  createOrder() {

    this.createOrderLoading = true;

    // Step 1: There must be at least 1 orderItem
    if (this.orderItems.length == 0) {
      return;
    }

    // Step 2: Total Bill must be positive
    if (this.totalBill <= 0 ) {
      return;
    }

    // Step 3: There should be one selected customer
    if (this.selectedCustomer == null || this.selectedCustomer == undefined) {
      return;
    }

    // const order: Order = this.orderFormGroup.value;
    const order: Order = new Order();
    order.customer = this.selectedCustomer;
    order.notes = this.notes;

    for (let orderItem of this.orderItems) {
      orderItem.product = orderItem.product._id;
    }
    order.orderItems = this.orderItems;

    if (this.selectedTags.length > 0) {
      var tags: string[] = [];
      for (let tag of this.selectedTags) {
        tags.push(tag.name);
      }
      order.tags = tags;
    }

    let shipping = new ShippingDetails();
    shipping.mode = this.shippingFeeMethod;
    shipping.fee = this.totalShippingFee;
    if (this.customShippingName) {
      shipping.customName = this.customShippingName;
    }
    order.shipping = shipping;

    if (this.paymentStatus != null) {
      order.paymentStatus = this.paymentStatus;
    }

    if (this.discountInput > 0) {
      this.orderDiscount.discount = this.discountInput;
      this.orderDiscount.mode = this.discountMethod;
      this.orderDiscount.reason = this.discountReason;
      order.discount = this.orderDiscount;
    }

    order.total = this.totalBill;

    this.orderService.createOrder(order)
      .pipe(
        finalize(() => {
          this.createOrderLoading = false;
        })
      )
      .subscribe(
        order => {
          this.createOrderError = null;
          this.createOrderTransaction(order._id);
          this.router.navigate([`/admin/orders/${order._id}`], 
          {queryParams: { newOrder: true }});
        },
        error => {
          this.createOrderError = error;
        }
      );
  }

  createOrderTransaction(orderId: string) {
    let transaction = new OrderTransaction();
    transaction.orderId = orderId;
    transaction.type = OrderTransactionType.ORDER_CREATED;
    transaction.summary = `Order created by admin ${this.currentUser.username}`;
    this.orderTransactionService.addOrderTransaction(transaction)
      .pipe()
      .subscribe();
  }
}