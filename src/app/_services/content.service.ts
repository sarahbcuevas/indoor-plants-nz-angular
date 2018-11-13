import { Injectable, OnInit, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Content } from '../_models/content';
import { baseURL } from '../_helpers/baseurl';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class ContentService  implements OnInit {

  public contentUrl = baseURL + '/content';

  constructor(
    private http: HttpClient,
    @Inject('BaseURL') public BaseURL
  ) { }

  ngOnInit() {
    this.getContent();
  }

  /** Create new content in server */
  addContent(content: Content) {
    return this.http.post(this.contentUrl, content);
  }

  /** GET contents from the server */
  getContent(): Observable<Content[]> {
    return this.http.get<Content[]>(this.contentUrl)
      .pipe(
        tap(content => console.log(`fetched contents`)),
        catchError(this.handleError(`getContent`, []))
      );
  }

  /** UPDATE content by id */
  updateContent(content: Content) {
    const url = this.contentUrl + '/' + content._id;
    return this.http.put(url, content)
      .pipe(
        tap((updated_content: Content) => console.log(`update content with id ${updated_content._id}`))
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
