import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Customer } from '../_models/customer';
import { baseURL } from '../_helpers/baseurl';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private customersUrl = baseURL + '/customer/';

  constructor(
    private http: HttpClient
  ) { }

  /** GET customers from the server */
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.customersUrl)
      .pipe(
        tap(customers => console.log(`fetched customers`)),
        catchError(this.handleError(`getCustomers`, []))
      );
  }

  /** GET customer by id from the server */
  getCustomerById(id: string) {
    const url = this.customersUrl + id;
    return this.http.get<Customer>(url)
      .pipe(
        tap(customer => console.log(`fetched customer with id ${id}`))
      );
  }

  /** Create new customer */
  createCustomer(customer: Customer) {
    const url = this.customersUrl + 'create';
    return this.http.post(url, customer)
      .pipe(
        tap((new_customer: Customer) => console.log(`registered new customer with id ${new_customer._id}`))
      );
  }

  /** Update customer information */
  updateCustomer(customer: Customer) {
    const url = this.customersUrl + customer._id;
    return this.http.put(url, customer)
      .pipe(
        tap((updated_customer: Customer) => console.log(`updated customer with id ${updated_customer._id}`))
      );
  }

  /** DELETE customer by id */
  deleteCustomerById(id: string) {
    const url = this.customersUrl + id;
    return this.http.delete(url)
      .pipe(
        tap((customer: Customer) => console.log(`deleted customer with id ${customer._id}`)),
        catchError(this.handleError(`deleteCustomerById`, []))
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
