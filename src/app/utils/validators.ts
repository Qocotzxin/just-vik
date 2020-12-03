import { AbstractControl } from '@angular/forms';
import { Product } from '../model/product';

/**
 * Stock validation to avoid a quantity bigger than
 * the current stock.
 * @param form: AbstractControl
 */
export function maxStock(form: AbstractControl) {
  const quantity = +form.get('quantity')?.value || 0;
  const stock =
    (form.get('product')?.value &&
      +(form.get('product')?.value as Product).stock) ||
    0;

  if (quantity > stock) {
    return { maxStock: true };
  }
  return null;
}
