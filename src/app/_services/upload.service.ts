import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { baseURL } from '../_helpers/baseurl';
import { catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  private uploadUrl = baseURL + '/sign-s3';
  constructor(
    private http: HttpClient
  ) { }

  /** Delete previously uploaded file from the server */
  deleteUpload(path: string) {
    const filename = path.split('/');
    const url = this.uploadUrl + '?file-name=' + filename[filename.length-1];
    console.log('Url: ', url);
    return this.http.delete(url)
      .pipe(
        tap(() => console.log(`deleted file ${path}`)),
        catchError(this.handleError(`deleteUpload`, []))
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
