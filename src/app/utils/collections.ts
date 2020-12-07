export enum COLLECTIONS {
  PRODUCTS = 'products',
  SALES = 'sales',
  USERS = 'users',
}

export const COLLECTION_CONFIG = { idField: 'id' };

export const COLLECTION_COMPARISONS = {
  EQUAL: '==',
  GREATER_OR_EQUAL: '>=',
  LESS_OR_EQUAL: '<=',
  GREATER_THAN: '>',
  LESS_THAN: '<',
};

export const COLLECTION_FIELDS = {
  LAST_MODIFICATION: 'lastModification',
  SALES_TOTAL: 'salesTotal',
  QUANTITY: 'quantity',
  PRODUCT: 'product',
  SALES_UNIT_PRICE: 'salesUnitPrice',
  GROSS_UNIT_PRICE: 'grossUnitPrice'
}
