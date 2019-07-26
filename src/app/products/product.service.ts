import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, throwError, combineLatest, BehaviorSubject, Subject, merge, from } from 'rxjs';
import { catchError, tap, map, scan, shareReplay, mergeMap, toArray, filter, switchMap } from 'rxjs/operators';

import { Product } from './product';
import { Supplier } from '../suppliers/supplier';
import { SupplierService } from '../suppliers/supplier.service';
import { ProductCategory } from '../product-categories/product-category';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient,
    private supplierService: SupplierService) { }
  private productsUrl = 'api/products';
  private productCategoriesUrl = 'api/productCategories';
  private suppliersUrl = this.supplierService.suppliersUrl;

  products$ = this.http
    .get<Product[]>(this.productsUrl)
    .pipe(
      tap(data => console.log('Products: ', JSON.stringify(data))),
      map(products => products.map(product => ({
        ...product,
        price: product.price * 1.5,
        searchKey: [product.productName]
      }) as Product)),
      shareReplay(1),
      catchError(this.handleError)
    );
  productCategories$ = this.http.get<ProductCategory[]>(this.productCategoriesUrl);

  productsWithCategories$ = combineLatest([
    this.products$,
    this.productCategories$
  ]).pipe(
    map(([products, categories]) => products.map(product => ({
      ...product,
      category: categories.find(c => product.categoryId === c.id).name
    }) as Product))
  );

  private productSelectedSubject = new BehaviorSubject<number>(0);
  selectedProductId$ = this.productSelectedSubject.asObservable();

  selectedProduct$ = combineLatest([this.productsWithCategories$, this.selectedProductId$])
    .pipe(
      map(([products, selectedProductId]) => products.find(product => product.id === selectedProductId)),
      shareReplay(1),
      tap(product => console.log('selectedProduct: ', product))
    );

  private productInsertedSubject = new Subject<Product>();
  productInsertedAction$ = this.productInsertedSubject.asObservable();

  productsWithAdd$ = merge(
    this.productsWithCategories$,
    this.productInsertedAction$
  ).pipe(scan((acc: Product[], value: Product) => [...acc, value]));

  // // "get it all approach"
  // selectedProductSuppliers$ = combineLatest([
  //   this.selectedProduct$,
  //   this.supplierService.suppliers$
  // ]).pipe(
  //   map(([selectedProduct, suppliers]) => suppliers.filter(supplier => selectedProduct.supplierIds.includes(supplier.id)))
  // );

  // "just in time approach"
  selectedProductSuppliers$ = this.selectedProduct$
  .pipe(
    filter(selectedProduct => Boolean(selectedProduct)),
    // only gets the suppliers for the last selected product(vs. mergeMap which might return a set of suppliers for a different product if they are selected in close succession)
    switchMap(selectedProduct =>
      from(selectedProduct.supplierIds)
      .pipe(
        mergeMap(supplierId => this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)),
        toArray()
      ))
  );

  addProduct(newProduct?: Product) {
    newProduct = newProduct || this.fakeProduct();
    this.productInsertedSubject.next(newProduct);
  }

  private fakeProduct() {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      category: 'Toolbox',
      quantityInStock: 30
    };
  }

  selectedProductChanged(selectedProductId: number): void {
    this.productSelectedSubject.next(selectedProductId);
  }

  private handleError(err: any) {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }

}
