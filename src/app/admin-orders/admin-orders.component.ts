import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { OrderItem, Order, OrderStatus, PaymentStatus, FulfillmentStatus } from '../_models/order';
import { CustomerService } from '../_services/customer.service';
import { OrderService } from '../_services/order.service';
import { finalize, tap, map } from 'rxjs/operators';

export const Filter = {
  'ALL': 'All',
  'OPEN': 'Open',
  'UNFULFILLED': 'Unfulfilled',
  'UNPAID': 'Unpaid',
  'COMPLETED': 'Completed'
};

export const Sort = {
  'NEWEST': 'Date (newest first)',
  'OLDEST': 'Date (oldest first)',
  'CUSTOMER_A_TO_Z': 'Customer (A to Z)',
  'CUSTOMER_Z_TO_A': 'Customer (Z to A)'
};

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {

  orderStatuses = OrderStatus;
  OrderItems: [OrderItem];
  orders: Order[];
  isOrdersLoading: boolean;
  isSelectVisible = false;

  Payment_Status = PaymentStatus;
  Fulfillment_Status = FulfillmentStatus;
  Order_Status = OrderStatus;

  selectedOrders: string[] = [];

  isArchived = false;

  FilterMode = Filter.ALL;
  FilterType = Filter;

  SortMode = Sort.NEWEST;
  SortType = Sort;

  ORDER_ID = 'Order ID';
  CUSTOMER_NAME = 'Customer name';
  TAG = 'Tag';

  OrderStatusFilter = Filter.ALL;
  PaymentStatusFilter = Filter.ALL;
  SearchBarFilter = this.ORDER_ID;

  sortFormGroup: FormGroup;

  searchText: string;

  isOpenOrderSelected = false;
  isCanceledOrderSelected = false;
  isPaidOrderSelected = false;
  isUnpaidOrderSelected = false;
  isFulfilledOrderSelected = false;
  isUnfulfilledOrderSelected = false;

  constructor(
    private customerService: CustomerService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {
    route.queryParams.subscribe(p => {
      if (p.archived) {
        this.isArchived = true;
      } else {
        this.isArchived = false;
      }

      this.OrderStatusFilter = Filter.ALL;
      this.PaymentStatusFilter = Filter.ALL;

      this.selectFilter(Filter.ALL);
    });

    this.sortFormGroup = this.formBuilder.group({
      sortBy: [Sort.NEWEST, Validators.required]
    });
  }

  ngOnInit(): void {
    this.getOrders();
  }

  getOrders(): void {
    this.isOrdersLoading = true;
    $('#toggleAll').prop('checked', false);
    this.resetSelectedOrders();

    this.orderService.getOrders()
      .pipe(
        map((orders) => {
          return orders.filter(order => {

            if (this.isArchived && order.orderStatus != OrderStatus.ARCHIVED) {
              return false;
            }

            if (!this.isArchived && order.orderStatus == OrderStatus.ARCHIVED) {
              return false;
            }

            if (this.OrderStatusFilter == OrderStatus.OPEN && order.orderStatus != OrderStatus.OPEN) {
              return false;
            }

            if (this.OrderStatusFilter == OrderStatus.CANCELED && order.orderStatus != OrderStatus.CANCELED) {
              return false;
            }

            if (this.PaymentStatusFilter == PaymentStatus.PENDING && order.paymentStatus != PaymentStatus.PENDING) {
              return false;
            }

            if (this.PaymentStatusFilter == PaymentStatus.PAID && order.paymentStatus != PaymentStatus.PAID) {
              return false;
            }

            if (this.PaymentStatusFilter == PaymentStatus.REFUNDED && order.paymentStatus != PaymentStatus.REFUNDED) {
              return false;
            }

            switch(this.FilterMode) {
              case Filter.ALL:
                return true;
              case Filter.OPEN:
                return order.orderStatus == OrderStatus.OPEN;
              case Filter.UNFULFILLED:
                return order.fulfillmentStatus == FulfillmentStatus.UNFULFILLED;
              case Filter.UNPAID:
                return order.paymentStatus == PaymentStatus.PENDING;
              case Filter.COMPLETED:
                return order.fulfillmentStatus == FulfillmentStatus.FULFILLED && order.paymentStatus == PaymentStatus.PAID;
              default:
                return false;
            }
          })
        }),
        tap((orders) => {
          orders.sort((a, b) => {
            switch (this.SortMode) {
              case Sort.NEWEST:
                if (a.createdAt > b.createdAt) {
                  return -1;
                } else if (a.createdAt < b.createdAt) {
                  return 1;
                }
                return 0;
              case Sort.OLDEST:
                if (a.createdAt < b.createdAt) {
                  return -1;
                } else if (a.createdAt > b.createdAt) {
                  return 1;
                }
                return 0;
              case Sort.CUSTOMER_A_TO_Z:
                if (a.customer.firstname < b.customer.firstname) {
                  return -1;
                } else if (a.customer.firstname > b.customer.firstname) {
                  return 1;
                }
                return 0;
              case Sort.CUSTOMER_Z_TO_A:
                if (a.customer.firstname > b.customer.firstname) {
                  return -1;
                } else if (a.customer.firstname < b.customer.firstname) {
                  return 1;
                }
                return 0;
              default:
                if (a.createdAt > b.createdAt) {
                  return -1;
                } else if (a.createdAt < b.createdAt) {
                  return 1;
                }
            }
          });
        }),
        finalize(() => {
          this.isOrdersLoading = false;
        })
      )
      .subscribe(
        orders => {
          this.orders = orders;
        }
      );
  }

  toggleSelection(order: Order) {
    if (this.isOrderSelected(order._id)) {
      this.selectedOrders.splice(this.selectedOrders.indexOf(order._id), 1);
    } else {
      this.selectedOrders.push(order._id);
    }
    this.checkStatusOfSelectedOrders();
  }

  toggleAll() {
    const isChecked = $('#toggleAll').prop('checked');
    for (let order of this.orders) {
      $('#' + order._id + '.checkbox').prop('checked', isChecked);

      if (isChecked) {
        if(!this.isOrderSelected(order._id)) {
          this.selectedOrders.push(order._id);
        }
      } 
    }

    if(isChecked) {
      this.checkStatusOfSelectedOrders();
    } else {
      this.resetSelectedOrders();
      this.isOpenOrderSelected = false;
      this.isCanceledOrderSelected = false;
      this.isPaidOrderSelected = false;
      this.isUnpaidOrderSelected = false;
      this.isFulfilledOrderSelected = false;
      this.isUnfulfilledOrderSelected = false;
    }
  }

  checkStatusOfSelectedOrders() {
    this.isOpenOrderSelected = false;
    this.isCanceledOrderSelected = false;
    this.isPaidOrderSelected = false;
    this.isUnpaidOrderSelected = false;
    this.isFulfilledOrderSelected = false;
    this.isUnfulfilledOrderSelected = false;
    for (let order of this.orders) {
      if (this.isOrderSelected(order._id)) {
        if (order.orderStatus == OrderStatus.OPEN) {
          this.isOpenOrderSelected = true;
        } else if (order.orderStatus == OrderStatus.CANCELED) {
          this.isCanceledOrderSelected = true;
        }

        if (order.paymentStatus == PaymentStatus.PAID) {
          this.isPaidOrderSelected = true;
        } else if (order.paymentStatus == PaymentStatus.PENDING) {
          this.isUnpaidOrderSelected = true;
        }

        if (order.fulfillmentStatus == FulfillmentStatus.FULFILLED) {
          this.isFulfilledOrderSelected = true;
        } else if (order.fulfillmentStatus == FulfillmentStatus.UNFULFILLED) {
          this.isUnfulfilledOrderSelected = true;
        }
      }
    }
  }

  isOrderSelected(id) {
    return this.selectedOrders.indexOf(id) >= 0;
  }

  resetSelectedOrders() {
    this.selectedOrders = [];
  }

  archiveOrders() {
    if (this.selectedOrders.length === 0) {
      return;
    }
    this.orderService.archiveOrders(this.selectedOrders)
      .pipe()
      .subscribe(
        orders => {
          this.getOrders();
        }
      );
  }

  unarchiveOrders() {
    if (this.selectedOrders.length === 0) {
      return;
    }
    this.orderService.unarchiveOrders(this.selectedOrders)
      .pipe()
      .subscribe(
        orders => {
          this.getOrders();
        }
      );
  }

  cancelOrders() {
    if (this.selectedOrders.length === 0) {
      return;
    }
    this.orderService.cancelOrders(this.selectedOrders)
      .pipe()
      .subscribe(
        orders => {
          this.getOrders();
        }
      );
  }

  uncancelOrders() {
    if (this.selectedOrders.length === 0) {
      return;
    }
    this.orderService.uncancelOrders(this.selectedOrders)
      .pipe()
      .subscribe(
        orders => {
          this.getOrders();
        }
      );
  }

  markOrdersAsPaid() {
    if (this.selectedOrders.length === 0) {
      return;
    }
    this.orderService.markOrdersAsPaid(this.selectedOrders)
      .pipe()
      .subscribe(
        orders => {
          this.getOrders();
        }
      );
  }

  markOrdersAsUnpaid() {
    if (this.selectedOrders.length === 0) {
      return;
    }
    this.orderService.markOrdersAsUnpaid(this.selectedOrders)
      .pipe()
      .subscribe(
        orders => {
          this.getOrders();
        }
      );
  }

  markOrdersAsFulfilled() {
    if (this.selectedOrders.length === 0) {
      return;
    }
    this.orderService.markOrdersAsFulfilled(this.selectedOrders)
      .pipe()
      .subscribe(
        orders => {
          this.getOrders();
        }
      );
  }

  markOrdersAsUnfulfilled() {
    if (this.selectedOrders.length === 0) {
      return;
    }
    this.orderService.markOrdersAsUnfulfilled(this.selectedOrders)
      .pipe()
      .subscribe(
        orders => {
          this.getOrders();
        }
      );
  }

  permanentlyDeleteOrders() {
    if (this.selectedOrders.length === 0) {
      return;
    }
    this.orderService.deleteOrders(this.selectedOrders)
      .pipe()
      .subscribe(
        orders => {
          this.getOrders();
        }
      );
  }

  selectFilter(filter: string) {
    this.FilterMode = filter;
    this.getOrders();
  }

  showSelect() {
    this.isSelectVisible = !this.isSelectVisible;
  }

  sortOrders() {
    this.SortMode = this.sortFormGroup.get('sortBy').value;
    this.getOrders();
  }

  filterByOrderStatus(filter) {
    this.OrderStatusFilter = filter;
    this.getOrders();
  }

  filterByPaymentStatus(filter) {
    this.PaymentStatusFilter = filter;
    this.getOrders();
  }

  filterBy(filter) {
    this.SearchBarFilter = filter;
  }
}
