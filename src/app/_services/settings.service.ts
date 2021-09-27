import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { baseURL } from '../_helpers/baseurl';
import { Settings } from '../_models/settings';
import { catchError, tap } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private settingsUrl = baseURL + '/settings/';

  constructor(
    private http: HttpClient
  ) { }

  /** GET current system settings */
  getSettings() {
    return this.http.get<Settings>(this.settingsUrl)
      .pipe(
        tap(settings => console.log(`fetched system settings`))
      );
  }

  updateSettings(settings: Settings) {
    const url = this.settingsUrl + settings._id;
    return this.http.put(url, settings)
      .pipe(
        tap((updated_settings: Settings) => console.log(`updated settings with id ${updated_settings._id}`))
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
