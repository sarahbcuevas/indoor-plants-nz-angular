import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SocialMedia } from '../_models/socialmedia';
import { baseURL } from '../_helpers/baseurl';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class SocialmediaService implements OnInit {

  public socialMediaUrl = baseURL + '/socialmedia';

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.getSocialMedia();
  }

  /** Create new social media in server */
  addSocialMedia(socialMedia: SocialMedia) {
    return this.http.post(this.socialMediaUrl, socialMedia);
  }

  /** GET social media accounts from the server */
  getSocialMedia(): Observable<SocialMedia[]> {
    return this.http.get<SocialMedia[]>(this.socialMediaUrl)
      .pipe(
        tap(socialMedia => console.log(`fetched social media`)),
        catchError(this.handleError(`getSocialMedia`, []))
      );
  }

  /** UPDATE social media by id */
  updateSocialMedia(socialMedia: SocialMedia) {
    const url = this.socialMediaUrl + '/' + socialMedia._id;
    return this.http.put(url, socialMedia)
      .pipe(
        tap((newSocialMedia: SocialMedia) => console.log(`update social media with id ${newSocialMedia._id}`))
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
