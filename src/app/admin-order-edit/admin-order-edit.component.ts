import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderService } from '../_services/order.service';
import { CustomerService } from '../_services/customer.service';
import { ProductService } from '../_services/product.service';
import { finalize, tap, map } from 'rxjs/operators';
import { Customer } from '../_models/customer';
import { Product } from '../_models/product';
import { Order, OrderItem, OrderDiscount, DiscountMethod, PaymentStatus, FulfillmentStatus, ShippingFeeMethod, ShippingDetails } from '../_models/order';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import location from '../../assets/cities.json';

export class Tag {
  name: string;
  selected: boolean;
}

export class SelectedTag {
  name: string;
  indexInAllTags: number; // index in AllTags or -1 if not in AllTags
}

@Component({
  selector: 'app-admin-order-edit',
  templateUrl: './admin-order-edit.component.html',
  styleUrls: ['./admin-order-edit.component.scss']
})
export class AdminOrderEditComponent implements OnInit {

  selectedCustomer: Customer;
  order: Order = null;
  originalOrder: Order = null;
  orderItems: OrderItem[] = [];
  customerOrders: Order[];
  saveOrderLoading: boolean;

  additionalDetailsFormGroup: FormGroup;
  editShippingAddressFormGroup: FormGroup;
  editOrderContactFormGroup: FormGroup;
  addDiscountFormGroup: FormGroup;
  addShippingFormGroup: FormGroup;

  Payment_Status = PaymentStatus;
  Fulfillment_Status = FulfillmentStatus;
  Discount_Method = DiscountMethod;
  Shipping_Fee_Method = ShippingFeeMethod;

  countries = [];
  regions = [];
  cities = [];
  countryIndex = 0;
  regionIndex = 0;
  cityIndex = 0;

  editShippingAddressError: string;

  customers: Customer[];
  isCustomersLoading: boolean;
  editOrderContactLoading: boolean;
  editOrderContactError: string;
  editShippingAddressLoading: boolean;

  tagsInput: string;
  allTags: Tag[] = [];
  selectedTags: SelectedTag[] = [];
  selectedTagsDraft: SelectedTag[] = [];

  products: Product[];
  isProductsLoading:boolean;
  selectedProducts = [];

  discountMethod = DiscountMethod.DOLLAR;
  discountInput = 0;
  discountReason: string;
  addDiscountError: string = '';
  addShippingError: string = '';

  subTotal: number;
  totalShippingFee: number;
  baseShippingFee = 0;
  totalBill: number;

  createOrderError: string = null;
  editOrderLoading: boolean;

  shippingFeeMethod = ShippingFeeMethod.STANDARD;
  customShippingName: string;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private orderService: OrderService,
    private customerService: CustomerService,
    private productService: ProductService,
    private router: Router,
  ) {
    this.additionalDetailsFormGroup = this.formBuilder.group({
      notes: ['']
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

    this.addDiscountFormGroup = this.formBuilder.group({
      discount: ['0', Validators.required],
      mode: [''],
      reason: ['']
    });

    this.addShippingFormGroup = this.formBuilder.group({
      shippingFeeMethod: [ShippingFeeMethod.STANDARD, Validators.required],
      customName: [''],
      shipping: ['0', Validators.required]
    });
  }

  ngOnInit() {
    this.getOrderDetails();
    this.loadAllTags();
    this.loadCountries();
    this.loadCustomers();
  }

  goBack() {
    this.location.back();
  }

  initializeOrderItems() {
    for (let orderItem of this.orderItems) {
      this.selectedProducts.push(orderItem.product._id);
    }
  }

  loadProducts() {
    this.isProductsLoading = true;
    this.productService.getProducts()
      .pipe(
        map((products) => {
          return products.filter(prod => {
            return !this.isProductSelected(prod._id)
          })
        }),
        finalize(() => {
          this.isProductsLoading = false;
        }
      )).subscribe(
        products => {
          this.products = products;
        }
      );
  }

  selectProduct(product:Product, quantity:number) {
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

  loadCountries() {
    this.countries = [];
    for (let i=0; i<location.length; i++) {
      this.countries.push(location[i].country);
    }
  }

  loadCustomers() {
    this.isCustomersLoading = true;
    this.customerService.getCustomers()
      .pipe(
        finalize(() => {
          this.isCustomersLoading = false;
        })
      ).subscribe(
        customers => {
          this.customers = customers;
        }
      );
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

  getOrderDetails() {
    const id = this.route.snapshot.paramMap.get('id');
    this.orderService.getOrderById(id)
      .pipe(
        finalize(() => {
          this.calculateBill();
          this.loadShippingAddress(this.selectedCustomer);
          this.loadOrderContact();
          this.initializeOrderItems();
          this.loadProducts();
        })
      ).subscribe(
        order => {
          this.order = order;
          this.originalOrder = JSON.parse(JSON.stringify(order));
          this.orderItems = order.orderItems;
          this.selectedCustomer = order.customer;
          this.orderService.getOrdersByCustomerId(this.selectedCustomer._id).pipe()
            .subscribe(
              customerOrders => {
                this.customerOrders = customerOrders;
              }
            );
          if (order.notes) {
            this.additionalDetailsFormGroup.get('notes').setValue(order.notes);
          }
          
          for (let tag of order.tags) {
            let newTag = new Tag();
            let index = this.allTags.findIndex(function(tempTag) {
              return tempTag.name == tag;
            });
            newTag.name = tag;
            newTag.selected = false;
            this.addSelectedTag(tag, index);
          }

          if (order.discount) {
            this.addDiscountFormGroup.get('discount').setValue(order.discount.discount);
            this.addDiscountFormGroup.get('mode').setValue(order.discount.mode);
            if (order.discount.reason) {
              this.addDiscountFormGroup.get('reason').setValue(order.discount.reason);
            }
            this.discountInput = order.discount.discount;
            this.discountReason = order.discount.reason;
            this.setDiscountMethod(order.discount.mode);
          }

          this.shippingFeeMethod = order.shipping.mode;
          this.addShippingFormGroup.get('shippingFeeMethod').setValue(this.shippingFeeMethod);
          this.totalShippingFee = order.shipping.fee;
          this.addShippingFormGroup.get('shipping').setValue(this.totalShippingFee/100);
          if (order.shipping.customName) {
            this.customShippingName = order.shipping.customName;
            this.addShippingFormGroup.get('customName').setValue(this.customShippingName);
          }
        }
      );
  }

  loadOrderContact() {
    if (this.selectedCustomer._id) {
      this.editOrderContactFormGroup.get('_id').setValue(this.selectedCustomer._id);
    }
    this.editOrderContactFormGroup.get('email').setValue(this.selectedCustomer.email);
    this.editOrderContactFormGroup.get('contact').setValue(this.selectedCustomer.contact);
    this.editOrderContactFormGroup.get('apply').setValue(false);
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

  selectCustomer(customer) {
    this.selectedCustomer = customer;
    this.orderService.getOrdersByCustomerId(customer._id).pipe()
      .subscribe(
        customerOrders => {
          this.customerOrders = customerOrders;
        }
      );
    
    this.loadOrderContact();
    this.loadShippingAddress(customer);

  }

  deselectCustomer() {
    this.selectedCustomer = null;
    this.countryIndex = 0;
    this.regionIndex = 0;
    this.cityIndex = 0;
  }

  editOrderContact() {
    this.editOrderContactLoading = true;
    var customer = new Customer();
    customer._id = this.editOrderContactFormGroup.get('_id').value;
    customer.email = this.editOrderContactFormGroup.get('email').value;
    customer.contact = this.editOrderContactFormGroup.get('contact').value;
    const apply = this.editOrderContactFormGroup.get('apply').value;

    if (customer._id) {
      this.customerService.updateCustomer(customer)
        .pipe()
        .subscribe(
          updated_customer => {
            this.selectedCustomer = updated_customer;
            this.editOrderContactError = null;
            $('#editOrderContactModal').hide();
            $('.modal-backdrop').remove();
          },
          error => {
            this.editOrderContactError = 'Customer with that email already exists';
          }
        );
    }

    if (apply && customer._id) {
      this.orderService.getOrdersByCustomerId(customer._id)
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
            $('#editOrderContactModal').hide();
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
            $('#editOrderContactModal').hide();
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
            $('#editShippingAddressModal').hide();
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
            $('#editShippingAddressModal').hide();
            $('.modal-backdrop').remove();
          })
        ).subscribe();
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

  removeSelectedTag(tags: SelectedTag[], index: number) {
    var removedTag = tags.splice(index, 1);
    if (removedTag[0].indexInAllTags >= 0) {
      this.allTags[removedTag[0].indexInAllTags].selected = false;
    }
  }

  duplicateSelectedTag(origin: SelectedTag[], dest: SelectedTag[]) {
    dest = [];
    for (let tag of origin) {
      const duplicate = JSON.parse(JSON.stringify(tag));
      dest.push(duplicate);
    }

    return dest;
  }

  applyTags() {
    this.selectedTags = this.duplicateSelectedTag(this.selectedTagsDraft, this.selectedTags);
    this.selectedTagsDraft = [];

    this.revertSelectPropertiesOfAllTags();

    $('#viewAllTagsModal').hide();
    $('.modal-backdrop').remove();
  }

  revertSelectPropertiesOfAllTags() {
    // Revert back select property of tags in allTags array (some may be draft deselected)
    for (let tag of this.allTags) {
      let index = this.selectedTags.findIndex(function(tempTag) {
        return tag.name == tempTag.name;
      });

      if (index >= 0) {
        tag.selected = true;
      } else {
        tag.selected = false;
      }
    }
  }

  initializeSelectedTagsDraft() {
    this.selectedTagsDraft = this.duplicateSelectedTag(this.selectedTags, this.selectedTagsDraft);
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

  onKeyPress(event: KeyboardEvent) {
    const inputChar = event.code;

    if (inputChar == 'Enter' || inputChar == 'NumpadEnter') {
      const tag = JSON.parse(JSON.stringify(this.tagsInput));
      this.addNewTag(tag);
      this.tagsInput = null;
      this.tagsInput = '';
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
    this.discountInput = this.addDiscountFormGroup.get('discount').value;
    this.discountReason = this.addDiscountFormGroup.get('reason').value;

    if (this.discountInput < 0 || this.discountInput == null) {
      this.addDiscountError = 'Discount amount invalid.';
      return;
    }

    if (this.discountMethod == DiscountMethod.DOLLAR) {
      if ((this.discountInput * 100) > this.subTotal) {
        this.addDiscountError = 'Discount should be less than the total bill.';
        return;
      }
      this.totalBill = this.subTotal + this.totalShippingFee - (this.discountInput*100);
      this.addDiscountError = '';
    }
    else if (this.discountMethod == DiscountMethod.PERCENT) {
      if (this.discountInput > 100) {
        this.addDiscountError = 'Percent discount should not be more than 100%';
        return;
      }
      this.totalBill = (this.subTotal * ((100 - this.discountInput)/100)) + this.totalShippingFee;
      this.addDiscountError = '';
    }

    if (this.totalBill <= 0) {
      this.createOrderError = 'Total bill should be positive.';
    } else {
      this.createOrderError = null;
    }

    if (this.order.discount == undefined) {
      let discount = new OrderDiscount();
      discount.discount = this.discountInput;
      discount.mode = this.discountMethod;
      discount.reason = this.discountReason;
      this.order.discount = discount;
    } else {
      this.order.discount.discount = this.discountInput;
      this.order.discount.mode = this.discountMethod;
      this.order.discount.reason = this.discountReason;
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

  calculateBill() {
    this.subTotal = 0
    this.totalBill = 0;
    this.baseShippingFee = 0;
    for (let i=0; i<this.orderItems.length; i++) {
      if (!this.orderItems[i].product.forPickupOnly) {
        this.baseShippingFee += (this.orderItems[i].product.deliveryFee * this.orderItems[i].quantity);
      }
      this.subTotal += (this.orderItems[i].product.price * this.orderItems[i].quantity);
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

  markAsPaid() {
    this.order.paymentStatus = PaymentStatus.PAID;
  }

  markAsPending() {
    this.order.paymentStatus = PaymentStatus.PENDING;
  }

  fulfillItems() {
    this.order.fulfillmentStatus = FulfillmentStatus.FULFILLED;
  }

  unfulfillItems() {
    this.order.fulfillmentStatus = FulfillmentStatus.UNFULFILLED;
  }

  updateStocks(order: Order) {
    // Update stocks if quantity of order items are updated
    let originalOrderItems = this.originalOrder.orderItems;
    let updatedOrderItems = order.orderItems;

    let checkedItems = [];
    for (let orderItem of originalOrderItems) {
      let itemIndex = updatedOrderItems.findIndex(function(item) {
        return item.product._id == orderItem.product._id;
      });
      if (itemIndex >= 0) {
        if (orderItem.quantity != updatedOrderItems[itemIndex].quantity) {
          const updateStock = updatedOrderItems[itemIndex].quantity - orderItem.quantity;
          let product = new Product();
          product._id = orderItem.product._id;
          product.stock = orderItem.product.stock - updateStock;
          this.productService.updateProduct(product).pipe().subscribe();
        }
      } else {
        const updateStock = -orderItem.quantity;
        let product = new Product();
        product._id = orderItem.product._id;
        product.stock = orderItem.product.stock - updateStock;
        this.productService.updateProduct(product).pipe().subscribe();
      }

      checkedItems.push(orderItem.product._id);
    }

    // Update stocks of newly added items
    for (let orderItem of updatedOrderItems) {
      const isAlreadyChecked = checkedItems.indexOf(orderItem.product._id);

      if (isAlreadyChecked >= 0) {
        continue;
      }

      let product = new Product();
      product._id = orderItem.product._id;
      product.stock = orderItem.product.stock - orderItem.quantity;
      this.productService.updateProduct(product).pipe().subscribe();
      checkedItems.push(orderItem.product._id);
    }

  }

  saveOrder() {

    this.saveOrderLoading = true;

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
    order._id = this.order._id;
    order.customer = this.selectedCustomer;
    order.notes = this.additionalDetailsFormGroup.get('notes').value;
    order.paymentStatus = this.order.paymentStatus;
    order.fulfillmentStatus = this.order.fulfillmentStatus;

    for (let orderItem of this.orderItems) {
      orderItem.product = orderItem.product._id;
    }
    order.orderItems = this.orderItems;

    var tags: string[] = [];
    for (let tag of this.selectedTags) {
      tags.push(tag.name);
    }
    order.tags = tags;

    let shipping = new ShippingDetails();
    shipping.mode = this.shippingFeeMethod;
    shipping.fee = this.totalShippingFee;
    if (this.customShippingName) {
      shipping.customName = this.customShippingName;
    }
    order.shipping = shipping;

    if (this.discountInput >= 0) {
      let orderDiscount = new OrderDiscount();
      orderDiscount.discount = this.discountInput;
      orderDiscount.mode = this.discountMethod;
      orderDiscount.reason = this.discountReason;
      order.discount = orderDiscount;
    }

    order.total = this.totalBill;

    this.orderService.updateOrder(order)
      .pipe(
        finalize(() => {
          this.saveOrderLoading = false;
        })
      )
      .subscribe(
        order => {
          this.updateStocks(order);
          this.createOrderError = null;
          this.router.navigate([`/admin/orders/${order._id}`]);
        },
        error => {
          this.createOrderError = error;
        }
      );
  }
}
