export const OrderTransactionType = {
  'ORDER_CREATED': 'Order Created',
  'PAYMENT_RECEIVED': 'Payment Received',
  'ITEMS_FULFILLED': 'Items Fulfilled',
  'ORDER_ARCHIVED': 'Order Archived',
  'ORDER_UNARCHIVED': 'Order Unarchived',
  'ORDER_CANCELED': 'Order Canceled',
  'ORDER_UNCANCELED': 'Undo Order Cancel'
};

export class OrderTransaction {
  _id: string;
  orderId: string;
  summary: string;
  type: string;
  createdAt: string;
}
  