import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import OrdersView from '../views/OrdersView.vue';
import ClientsView from '../views/ClientsView.vue';
import ProductsView from '../views/ProductsView.vue';

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: '/orders',
    name: 'orders',
    component: OrdersView,
  },
  {
    path: '/clients',
    name: 'clients',
    component: ClientsView,
  },
  {
    path: '/products',
    name: 'products',
    component: ProductsView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
