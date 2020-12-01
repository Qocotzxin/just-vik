import { AbstractControl } from '@angular/forms';
import { Product } from '../model/product';

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
