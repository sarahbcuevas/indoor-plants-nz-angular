import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { baseURL } from '../_helpers/baseurl';
import { Message } from '../_models/message';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SendMailService {

  public sendMailUrl = baseURL + '/send/';

  constructor(
    private http: HttpClient
  ) { }

  sendMail(message: Message) {
    return this.http.post(this.sendMailUrl, message)
      .pipe(
        tap((resp) => console.log('message has been sent')),
        catchError(this.handleError(`sendMail`, []))
      );
  }

  sendOrderConfirmationMail(order) {
    const url = this.sendMailUrl + 'order';
    return this.http.post(url, order)
      .pipe(
        tap((resp) => console.log(`order confirmation email sent!`))
      );
  }

  sendOrderFulfillmentMail(order) {
    const url = this.sendMailUrl + 'order/fulfill';
    return this.http.post(url, order)
      .pipe(
        tap((resp) => console.log(`order fulfillment email sent!`))
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
