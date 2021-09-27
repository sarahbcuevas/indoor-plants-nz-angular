import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { baseURL } from '../_helpers/baseurl';
import { OrderTransaction } from '../_models/ordertransaction';
import { catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class OrderTransactionService {

  private transactionUrl = baseURL + '/orderTransaction/';    // URL to web api

  constructor(
    private http: HttpClient
  ) { }

  /** Add new order transaction */
  addOrderTransaction(transaction: OrderTransaction) {
    return this.http.post(this.transactionUrl, transaction)
      .pipe(
        tap((new_transaction: OrderTransaction) => console.log(`created new transaction with id ${new_transaction._id}`)),
        catchError(this.handleError(`addOrderTransaction`, []))
      );
  }

  /** Get order transaction history by order id */
  getOrderTransactions(orderId: string) {
    const url = this.transactionUrl + orderId;
    return this.http.get<OrderTransaction[]>(url)
      .pipe(
        tap(transactions => console.log(`fetched order transactions`)),
        catchError(this.handleError(`getOrderTransactions`, []))
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
      // console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
