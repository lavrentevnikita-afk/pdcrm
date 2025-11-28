import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import OrdersView from '../views/OrdersView.vue';
import ClientsView from '../views/ClientsView.vue';
import ProductsView from '../views/ProductsView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true, layout: 'blank' },
  },
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


router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('pdcrm_token');

  const isPublic = to.meta && to.meta.public;

  if (!isPublic && !token) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath },
    });
  }

  if (to.name === 'login' && token) {
    return next({ name: 'dashboard' });
  }

  return next();
});
