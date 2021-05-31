import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Order, ShippingFeeMethod } from 'app/_models/order';
import { OrderService } from '../_services/order.service';
import { ContentService } from '../_services/content.service';
import { Content } from '../_models/content';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss']
})
export class OrderConfirmationComponent implements OnInit {

  name: string;
  orderId: string;
  order: Order;
  content: Content;
  Shipping_Fee_Method = ShippingFeeMethod;
  subTotal = 0;
  totalBill = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private contentService: ContentService
  ) { }

  ngOnInit(): void {
    this.orderId = this.route.snapshot.queryParams['orderId'];
    this.getOrderDetails();
    this.getContent();
  }

  getOrderDetails() {
    this.orderService.getOrderById(this.orderId)
      .pipe()
      .subscribe(
        order => {
          this.order = order;
          this.computeTotal()
        }
      );
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

  computeTotal() {
    this.subTotal = 0;
    this.totalBill = 0;
    this.order.orderItems.forEach(orderItem => {
      this.subTotal += orderItem.product.price * orderItem.quantity;
    });
    this.totalBill = this.subTotal + this.order.shipping.fee;
  }

}
