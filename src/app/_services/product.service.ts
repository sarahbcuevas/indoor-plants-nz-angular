import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Product } from '../_models/product';
import { baseURL } from '../_helpers/baseurl';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  public productsUrl = baseURL + '/products/';

  constructor(
    private http: HttpClient
  ) { }

  /** Create new product in server */
  addProduct(product: Product) {
    return this.http.post(this.productsUrl, product);
  }

  /** GET products from the server */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl)
      .pipe(
        tap(products => console.log(`fetched products`)),
        catchError(this.handleError(`getProducts`, []))
      );
  }

  /** GET product by id from the server */
  getProductById(id: string) {
    const url = this.productsUrl + id;
    return this.http.get<Product>(url)
      .pipe(
        tap(product => console.log(`fetched product with id ${product._id}`))
      );
  }

  /** GET products by Category from the server */
  getProductsByCategory(category_id: number): Observable<Product[]> {
    const url = `${this.productsUrl}/?category=${category_id}`;

    return this.http.get<Product[]>(url)
      .pipe(
        tap(products => console.log(`fetched products from category ${category_id}`)),
        catchError(this.handleError(`getProductsByCategory`, []))
      );
  }

  /** DELETE product by id */
  deleteProductById(id: string) {
    const url = this.productsUrl + id;
    return this.http.delete(url)
      .pipe(
        tap((product: Product) => console.log(`deleted product with id ${product._id}`)),
        catchError(this.handleError(`deleteCategoryById`, []))
      );
  }

  /** DELETE multiple products by id */
  deleteProducts(productIds: string[]) {
    const url = this.productsUrl + 'delete';
    return this.http.put(url, productIds)
      .pipe(
        tap((deleted_products: Product[]) => console.log(`deleted ${deleted_products.length} products`)),
        catchError(this.handleError(`deleteProducts`, []))
      );
  }

  /** DELETE all products */
  deleteAllProducts() {
    return this.http.delete(this.productsUrl)
      .pipe(
        tap(() => console.log(`deleted all products`)),
        catchError(this.handleError(`deleteAllProducts`, []))
      );
  }

  /** UPDATE product by id */
  updateProduct(product: Product) {
    const url = this.productsUrl + product._id;
    return this.http.put(url, product)
      .pipe(
        tap((updated_product: Product) => console.log(`update product with id ${updated_product._id}`))
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
