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
import { useAuthStore } from '../store/auth';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      public: true,
      title: 'Вход в систему',
    },
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        redirect: { name: 'dashboard' },
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: {
          requiresAuth: true,
          title: 'Дэшборд',
          subtitle: 'Краткое состояние по заказам',
        },
      },
      {
        path: 'orders',
        name: 'orders',
        component: OrdersView,
        meta: {
          requiresAuth: true,
          title: 'Заказы',
          subtitle: 'Список и работа с заказами',
        },
      },
      {
        path: 'cash',
        name: 'cash',
        component: CashView,
        meta: {
          requiresAuth: true,
          title: 'Касса',
          subtitle: 'Оплаты, приход и расход',
        },
      },
      {
        path: 'warehouse',
        name: 'warehouse',
        component: WarehouseView,
        meta: {
          requiresAuth: true,
          title: 'Склад',
          subtitle: 'Остатки материалов и движение',
        },
      },
      {
        path: 'staff',
        name: 'staff',
        component: StaffView,
        meta: {
          requiresAuth: true,
          title: 'Персонал',
          subtitle: 'Сотрудники и роли',
        },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: AnalyticsView,
        meta: {
          requiresAuth: true,
          title: 'Аналитика',
          subtitle: 'Выручка, загрузка и эффективность',
        },
      },
      {
        path: 'directories',
        name: 'directories',
        component: DirectoriesView,
        meta: {
          requiresAuth: true,
          title: 'Справочники',
          subtitle: 'Номенклатура, клиенты, настройки',
        },
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
        meta: {
          requiresAuth: true,
          title: 'Настройки',
          subtitle: 'Общие настройки системы',
        },
      },
      {
        path: 'permissions',
        name: 'permissions',
        component: PermissionsView,
        meta: {
          requiresAuth: true,
          title: 'Разрешения',
          subtitle: 'Права доступа по ролям',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (!requiresAuth) {
    if (to.name === 'login' && auth.isAuthenticated) {
      return next({ name: 'dashboard' });
    }
    return next();
  }

  if (!auth.isAuthenticated) {
    if (!auth.token) {
      auth.initFromStorage();
    }
    if (auth.token && !auth.user) {
      await auth.fetchMe();
    }
  }

  if (!auth.isAuthenticated) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath },
    });
  }

  return next();
});

export default router;
