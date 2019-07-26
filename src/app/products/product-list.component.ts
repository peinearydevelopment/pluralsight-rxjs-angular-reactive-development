import { Component, ChangeDetectionStrategy } from '@angular/core';

import { EMPTY, Subject, combineLatest } from 'rxjs';

import { Product } from './product';
import { ProductService } from './product.service';
import { catchError, map, startWith } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  private categorySelectedSubject = new Subject<number>();
  categorySelectedAction$ = this.categorySelectedSubject.asObservable();
  pageTitle = 'Product List';
  errorMessage = '';
  categories$ = this.productCategoriesService.productCategories$
  .pipe(catchError(err => {
    this.errorMessage = err;
    return EMPTY;
  }));

  products$ = this.productService
                  .productsWithCategories$
                  .pipe(catchError(err => {
                    this.errorMessage = err;
                    return EMPTY;
                  }));

  produtsSimpleFilter$ = combineLatest([this.productService
    .productsWithAdd$,
    this.categorySelectedAction$.pipe(startWith(0))
])
    .pipe(
      map(([products, categoryId]) => products.filter(product => categoryId ? product.categoryId === categoryId : true)),
      catchError(err => {
      this.errorMessage = err;
      return EMPTY;
    }));

  constructor(private productService: ProductService, private productCategoriesService: ProductCategoryService) { }

  onAdd(): void {
    this.productService.addProduct();
  }

  onSelected(categoryId: string): void {
    this.categorySelectedSubject.next(+categoryId);
  }
}
