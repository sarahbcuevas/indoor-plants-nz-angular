import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Order, OrderStatus } from '../_models/order';
import { baseURL } from '../_helpers/baseurl';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private orderUrl = baseURL + '/order/';

  constructor(
    private http: HttpClient
  ) { }

  /** GET orders from the server */
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.orderUrl)
      .pipe(
        tap(orders => console.log(`fetched orders`)),
        catchError(this.handleError(`getOrders`, []))
      );
  }

  /** GET all distinct order tags */
  getAllTags(): Observable<string[]> {
    const url = this.orderUrl + 'tags';
    return this.http.get<string[]>(url)
      .pipe(
        tap(tags => console.log(`fetched distinct order tags`)),
        catchError(this.handleError(`getAllTags`, []))
      );
  }

  /** GET order by id from the server */
  getOrderById(id: string): Observable<Order> {
    const url = this.orderUrl + id;
    return this.http.get<Order>(url)
      .pipe(
        tap(order => console.log(`fetched order with id ${id}`))
      );
  }

  /** GET orders by id of customer */
  getOrdersByCustomerId(customer_id: string) {
    const url = `${this.orderUrl}/?customer._id=${customer_id}`;

    return this.http.get<Order[]>(url)
      .pipe(
        tap(orders => console.log(`fetched orders by customer ${customer_id}`)),
        catchError(this.handleError(`getOrdersByCustomerId`, []))
      );
  }

  /** Create new order */
  createOrder(order: Order) {
    return this.http.post(this.orderUrl, order)
      .pipe(
        tap((new_order: Order) => console.log(`registered new order with id ${new_order._id}`))
      );
  }

  /** Update order information */
  updateOrder(order: Order) {
    const url = this.orderUrl + order._id;
    return this.http.put(url, order)
      .pipe(
        tap((updated_order: Order) => console.log(`updated order with id ${updated_order._id}`))
      );
  }

  /** DELETE order by id */
  deleteOrderById(id: string) {
    const url = this.orderUrl + id;
    return this.http.delete(url)
      .pipe(
        tap((order: Order) => console.log(`deleted order with id ${order._id}`)),
        catchError(this.handleError(`deleteOrderById`, []))
      );
  }

  /** DELETE multiple orders by id */
  deleteOrders(orderIds: string[]) {
    const url = this.orderUrl + 'delete';
    return this.http.put(url, orderIds)
      .pipe(
        tap((deleted_orders: Order[]) => console.log(`deleted ${deleted_orders.length} orders`)),
        catchError(this.handleError(`deleteOrderById`, []))
      );
  }

  /** ARCHIVE 1 order by id */
  archiveOrder(orderId: string) {
    const orderIds: string[] = [];
    orderIds.push(orderId);
    const url = this.orderUrl + 'archive';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`archived order ${orderId}`))
      );
  }

  /** UNARCHIVE 1 order by id */
  unarchiveOrder(orderId: string) {
    const orderIds: string[] = [];
    orderIds.push(orderId);
    const url = this.orderUrl + 'unarchive';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`unarchived order ${orderId}`))
      );
  }

  /** ARCHIVE multiple orders by id */
  archiveOrders(orderIds: string[]) {
    const url = this.orderUrl + 'archive';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`archived ${updated_orders.length} orders`))
      );
  }

  /** UNARCHIVE multiple orders by id */
  unarchiveOrders(orderIds: string[]) {
    const url = this.orderUrl + 'unarchive';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`unarchived ${updated_orders.length} orders`))
      );
  }

  /** CANCEL 1 order by id */
  cancelOrder(orderId: string) {
    const orderIds: string[] = [];
    orderIds.push(orderId);
    const url = this.orderUrl + 'cancel';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`canceled order ${orderId}`))
      );
  }

  /** UNCANCEL 1 order by id */
  uncancelOrder(orderId: string) {
    const orderIds: string[] = [];
    orderIds.push(orderId);
    const url = this.orderUrl + 'uncancel';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`uncanceled order ${orderId}`))
      );
  }

  /** CANCEL multiple orders by id */
  cancelOrders(orderIds: string[]) {
    const url = this.orderUrl + 'cancel';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`canceled ${updated_orders.length} orders`))
      );
  }

  /** UNCANCEL multiple orders by id */
  uncancelOrders(orderIds: string[]) {
    const url = this.orderUrl + 'uncancel';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`uncanceled ${updated_orders.length} orders`))
      );
  }

  /** Mark multiple orders as PAID */ 
  markOrdersAsPaid(orderIds: string[]) {
    const url = this.orderUrl + 'paid';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`marked ${updated_orders.length} orders as paid`))
      );
  }

  /** Mark multiple orders as UNPAID */ 
  markOrdersAsUnpaid(orderIds: string[]) {
    const url = this.orderUrl + 'unpaid';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`marked ${updated_orders.length} orders as unpaid`))
      );
  }

  /** Mark multiple orders as FULFILLED */ 
  markOrdersAsFulfilled(orderIds: string[]) {
    const url = this.orderUrl + 'fulfilled';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`marked ${updated_orders.length} orders as fulfilled`))
      );
  }

  /** Mark multiple orders as UNFULFILLED */ 
  markOrdersAsUnfulfilled(orderIds: string[]) {
    const url = this.orderUrl + 'unfulfilled';
    return this.http.put(url, orderIds)
      .pipe(
        tap((updated_orders: Order[]) => console.log(`marked ${updated_orders.length} orders as unfulfilled`))
      );
  }

  /** Handle Http operation that failed.
   *  Let the app continue.
   *  @param operation - name of the operation that failed
   *  @param result - optional value to return as the observable result
   */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
