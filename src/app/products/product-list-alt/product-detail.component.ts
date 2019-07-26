import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ProductService } from '../product.service';
import { catchError, filter, map,  } from 'rxjs/operators';
import { EMPTY, Subject, combineLatest } from 'rxjs';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {
  pageTitle = 'Product Detail';
  errorMessage = '';
  private errorMessageSubject = new Subject<string>();
  product$ = this.productService.selectedProduct$
  .pipe(catchError(err => {
    this.errorMessageSubject.next(err);
    return EMPTY;
  }));


  productSuppliers$ = this.productService.selectedProductSuppliers$
  .pipe(catchError(err => {
    this.errorMessageSubject.next(err);
    return EMPTY;
  }));

  vm$ = combineLatest([this.product$, this.productSuppliers$])
  .pipe(
    filter(([product]) => Boolean(product)),
    map(([product, productSuppliers]) => ({ product, productSuppliers }))
  );
  constructor(private productService: ProductService) { }

}
