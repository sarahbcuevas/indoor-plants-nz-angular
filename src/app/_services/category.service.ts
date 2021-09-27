import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Category } from '../_models/category';
import { baseURL } from '../_helpers/baseurl';

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
    providedIn: 'root'
})
export class CategoryService {

    private categoryUrl = baseURL + '/categories/';    // URL to web api

    constructor(
        private http: HttpClient
    ) { }

    /** Add new category */
    addCategory(category: Category) {
      return this.http.post(this.categoryUrl, category)
        .pipe(
          tap((new_category: Category) => console.log(`registered new category with id ${new_category._id}`))
        );
    }

    /** GET category by id */
    getCategoryById(id: string) {
      const url = this.categoryUrl + id;
      return this.http.get<Category>(url)
        .pipe(
            tap(category => console.log(`fetched category with id ${category._id}`))
          );
    }

    /** GET categories from the server */
    getCategories(): Observable<Category[]> {
      return this.http.get<Category[]>(this.categoryUrl)
        .pipe(
          tap(categories => console.log(`fetched categories`))
        );
    }

    /** DELETE category by id */
    deleteCategoryById(id: string) {
      const url = this.categoryUrl + id;
      return this.http.delete(url)
        .pipe(
          tap((category: Category) => console.log(`deleted category with id ${category._id}`)),
          catchError(this.handleError(`deleteCategoryById`, []))
        );
    }

    /** DELETE all categories */
    deleteAllCategories() {
      return this.http.delete(this.categoryUrl)
        .pipe(
          tap(() => console.log(`deleted all categories`)),
          catchError(this.handleError(`deleteAllCategories`, []))
        );
    }

    /** Update category details */
    updateCategory(category: Category) {
      const url = this.categoryUrl + category._id;
      return this.http.put(url, category)
        .pipe(
          tap((updated_category: Category) => console.log(`updated category with id ${updated_category._id}`))
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
