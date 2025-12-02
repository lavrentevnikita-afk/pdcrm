import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import OrdersView from '../views/OrdersView.vue';
import CashView from '../views/CashView.vue';
import WarehouseView from '../views/WarehouseView.vue';
import StaffView from '../views/StaffView.vue';
import AnalyticsView from '../views/AnalyticsView.vue';
import DirectoriesView from '../views/DirectoriesView.vue';
import SettingsView from '../views/SettingsView.vue';
import PermissionsView from '../views/PermissionsView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
      },
      {
        path: 'orders',
        name: 'orders',
        component: OrdersView,
      },
      {
        path: 'cash',
        name: 'cash',
        component: CashView,
      },
      {
        path: 'warehouse',
        name: 'warehouse',
        component: WarehouseView,
      },
      {
        path: 'staff',
        name: 'staff',
        component: StaffView,
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: AnalyticsView,
      },
      {
        path: 'directories',
        name: 'directories',
        component: DirectoriesView,
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
      },
      {
        path: 'permissions',
        name: 'permissions',
        component: PermissionsView,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
