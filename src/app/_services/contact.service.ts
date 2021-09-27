import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Contact } from '../_models/contact';
import { baseURL } from '../_helpers/baseurl';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class ContactService implements OnInit {

  public contactUrl = baseURL + '/contact';

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.getContact();
  }

  /** Create new contact in server */
  addContact(contact: Contact) {
    return this.http.post(this.contactUrl, contact);
  }

  /** GET contacts from the server */
  getContact(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.contactUrl)
      .pipe(
        tap(contact => console.log(`fetched contacts`)),
        catchError(this.handleError(`getContact`, []))
      );
  }

  /** UPDATE contact by id */
  updateContact(contact: Contact) {
    const url = this.contactUrl + '/' + contact._id;
    return this.http.put(url, contact)
      .pipe(
        tap((updated_contact: Contact) => console.log(`update contact with id ${updated_contact._id}`))
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
