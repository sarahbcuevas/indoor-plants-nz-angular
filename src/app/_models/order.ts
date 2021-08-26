import { Product } from './product';
import { Customer } from './customer';

export const OrderStatus = {
  'OPEN': 'Open',
  'ARCHIVED': 'Archived',
  'CANCELED': 'Canceled'
};

export const PaymentStatus = {
  'PENDING': 'Pending',
  'PAID': 'Paid',
  'REFUNDED': 'Refunded',
  'VOIDED': 'Voided'
};

export const FulfillmentStatus = {
  'UNFULFILLED': 'Unfulfilled',
  'FULFILLED': 'Fulfilled'
};

export const PaymentMethod = {
  'CASH': 'Cash',
  'PAYPAL': 'Paypal',
  'BANK_TRANSFER': 'Bank_Transfer'
};

export const DiscountMethod = {
  'DOLLAR': '$',
  'PERCENT': '%'
};

export const ShippingFeeMethod = {
  'STANDARD': 'standard',
  'FREE': 'free',
  'CUSTOM': 'custom',
  'PICKUP': 'pickup'
};

export class OrderItem {
  product: any;   // Product or product id
  quantity: number;
}

export class OrderDiscount {
  discount: number;
  mode: string;
  reason: string;
}

export class ShippingDetails {
  mode: string;
  fee: number;
  customName: string;
}

export class Order {
  _id: string;
  code: string;
  customer: Customer;
  orderStatus: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  shipping: ShippingDetails;
  paymentMethod: string;
  orderItems: OrderItem[];
  tags: string[];
  notes: String;
  discount: OrderDiscount;
  total: number;
  trackingNumber: string;
  createdAt: string;
}