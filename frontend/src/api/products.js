import { api } from './index';

export function fetchProducts(params = {}) {
  return api.get('/products', { params }).then((res) => res.data);
}
