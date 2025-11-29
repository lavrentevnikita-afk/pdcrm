import { api } from './index';

export function fetchProductCategories() {
  return api.get('/product-categories').then((res) => res.data);
}
