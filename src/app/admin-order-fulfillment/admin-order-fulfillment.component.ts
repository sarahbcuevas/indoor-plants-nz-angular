import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Order } from '../_models/order';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../_services/order.service';
import { UserService } from 'app/_services/user.service';
import { SendMailService } from '../_services/send-mail.service';
import { User } from '../_models/user';
import { FulfillmentStatus } from '../_models/order';
import { OrderTransactionType } from 'app/_models/ordertransaction';
import { OrderTransaction } from 'app/_models/ordertransaction';
import { OrderTransactionService } from 'app/_services/order-transaction.service';

@Component({
  selector: 'app-admin-order-fulfillment',
  templateUrl: './admin-order-fulfillment.component.html',
  styleUrls: ['./admin-order-fulfillment.component.scss']
})
export class AdminOrderFulfillmentComponent implements OnInit {

  order:Order;
  fulfillOrderFormGroup: FormGroup;
  currentUser: User;
  Fulfillment_Status = FulfillmentStatus;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private orderService: OrderService,
    private userService: UserService,
    private sendMailService: SendMailService,
    private orderTransactionService: OrderTransactionService,
    private formBuilder: FormBuilder,
  ) {
    this.fulfillOrderFormGroup = this.formBuilder.group({
      trackingNumber: [''],
      shippingCarrier: [''],
      notifyCustomer: [true]
    });
  }

  ngOnInit(): void {
    this.getOrderDetails();
    this.getCurrentUser();
  }

  getOrderDetails() {
    const id = this.route.snapshot.paramMap.get('id');
    this.orderService.getOrderById(id)
      .pipe()
      .subscribe(
        order => {
          this.order = order;
        }
      );
  }

  getCurrentUser() {
    this.userService.getCurrentUser()
      .subscribe(
        data => {
          this.currentUser = data;
        }
      );
  }

  fulfillItems() {
    const trackingNumber = this.fulfillOrderFormGroup.get('trackingNumber').value;
    const notifyCustomer = this.fulfillOrderFormGroup.get('notifyCustomer').value;

    // Fulfill Order
    const order = new Order();
    order._id = this.order._id;
    order.fulfillmentStatus = FulfillmentStatus.FULFILLED;

    // Save tracking URL, if there is
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    this.orderService.updateOrder(order)
      .pipe()
      .subscribe(
        order => {
          this.order = order;
          this.createOrderTransaction();

          // Display dialog showing order has been fulfilled
          this.showMessageModal();

          // Send email to customer if Notify customer checkbox is checked
          if (notifyCustomer) {
            this.sendFulfillmentEmail(order);
          }
        }
      );
  }

  createOrderTransaction() {
    let transaction = new OrderTransaction();
    transaction.orderId = this.order._id;
    transaction.type = OrderTransactionType.ITEMS_FULFILLED;
    transaction.summary = `All items were fulfilled by admin ${this.currentUser.username}`;
    this.orderTransactionService.addOrderTransaction(transaction)
      .pipe()
      .subscribe();
  }

  showMessageModal() {
    window.scroll(0, 0);
    $('#messageModal').modal('show');
  }

  sendFulfillmentEmail(order) {
    order.url = window.location.origin + '/order-confirmation?orderId=' + order._id;
    this.sendMailService.sendOrderFulfillmentMail(order)
      .pipe()
      .subscribe(
        success => {
        },
        error => {
          console.log('Failed to send order fulfillment email');
        }
      );
  }

  closeModal() {
    $('.modal-backdrop').remove();
  }

}
