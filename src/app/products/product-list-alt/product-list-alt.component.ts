import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ProductService } from '../product.service';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list-alt.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListAltComponent {
  pageTitle = 'Products';
  errorMessage = '';
  selectedProductId;

  products$ = this.productService
                  .productsWithCategories$
                  .pipe(catchError(err => {
                    this.errorMessage = err;
                    return EMPTY;
                  }));

  constructor(private productService: ProductService) { }

  onSelected(productId: number): void {
    console.log('Not yet implemented');
  }
}
