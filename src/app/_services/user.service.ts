import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../_models/user';
import { baseURL } from '../_helpers/baseurl';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private usersUrl = baseURL + '/users/';

  constructor(
    private http: HttpClient
  ) { }

  /** GET currently logged in user */
  getCurrentUser() {
    const url = this.usersUrl + 'profile';
    return this.http.get<User>(url)
      .pipe(
        tap(user => console.log(`fetched currently logged in user`))
      );
  }

  /** GET users from the server */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.usersUrl)
      .pipe(
        tap(users => console.log(`fetched users`)),
        catchError(this.handleError(`getUsers`, []))
      );
  }

  /** GET user by id from the server */
  getUserById(id: string) {
    const url = this.usersUrl + id;
    return this.http.get<User>(url)
      .pipe(
        tap(user => console.log(`fetched user with id ${id}`))
      );
  }

  /** Register new user */
  registerUser(user: User) {
    const url = this.usersUrl + 'register';
    return this.http.post(url, user)
      .pipe(
        tap((new_user: User) => console.log(`registered new user with id ${new_user._id}`))
      );
  }

  /** Update user information */
  updateUser(user: User) {
    const url = this.usersUrl + user._id;
    return this.http.put(url, user)
      .pipe(
        tap((updated_user: User) => console.log(`updated user with id ${updated_user._id}`))
      );
  }

  /** DELETE user by id */
  deleteUserById(id: string) {
    const url = this.usersUrl + id;
    return this.http.delete(url)
      .pipe(
        tap((user: User) => console.log(`deleted user with id ${user._id}`)),
        catchError(this.handleError(`deleteUserById`, []))
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
