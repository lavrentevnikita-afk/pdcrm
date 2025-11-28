import { api } from './index';

export function fetchOrders(params = {}) {
  return api.get('/orders', { params }).then((res) => res.data);
}

export function createOrder(payload) {
  return api.post('/orders', payload).then((res) => res.data);
}
