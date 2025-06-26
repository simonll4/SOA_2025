import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// Vistas y layouts
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import DashboardHome from '@/views/DashboardHome.vue'
import MonitoringView from '@/views/MonitoringView.vue'
import AdminProfilesView from '@/views/AdminProfilesView.vue' // todavía placeholder opcional
import UnauthorizedView from '@/views/UnauthorizedView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard-home',
          component: DashboardHome,
          meta: { requiresAuth: true, title: 'Panel de Control' },
        },
        {
          path: 'monitoring/:id',
          name: 'monitoring',
          component: MonitoringView,
          meta: { requiresAuth: true, title: 'Monitoreo' },
        },
        {
          path: 'admin/profiles',
          name: 'admin-profiles',
          component: AdminProfilesView,
          meta: { requiresAuth: true, requiresAdmin: true, title: 'Perfiles Biométricos' },
        },
      ],
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: UnauthorizedView,
      meta: { title: 'No Autorizado' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { title: 'Página no encontrada' },
    },
  ],
})

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, isAdmin, initKeycloak } = useAuth()

  if (!isAuthenticated.value) {
    try {
      await initKeycloak()
    } catch (err) {
      console.error('Auth error', err)
      return next('/unauthorized')
    }
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next('/unauthorized')
  }
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return next('/unauthorized')
  }

  if (to.meta.title) {
    document.title = `${to.meta.title as string} - SOA Monitor`
  }

  next()
})

export default router
