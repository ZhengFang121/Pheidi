import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import pinia from '@/stores'
import { useAuthStore } from '@/stores/auth'

import IntroPage from '@/views/IntroPage.vue'
import LoginPage from '@/views/LoginPage.vue'
import AccountPage from '@/views/AccountPage.vue'
import AcademyPage from '@/views/AcademyPage.vue'
import HomePage from '@/views/HomePage.vue'
import PlazaPage from '@/views/PlazaPage.vue'
import StationPage from '@/views/StationPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    /*
     * Intro 放在 MainLayout 外面，
     * 所以不會顯示登入後導覽列與 Footer。
     */
    {
      path: '/',
      alias: '/intro',
      name: 'intro',
      component: IntroPage,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },

    /*
     * 登入後頁面統一放在 MainLayout 裡。
     * 子路由使用絕對路徑，保留原本的頁面網址。
     */
    {
      path: '/app',
      component: MainLayout,
      redirect: '/home',

      children: [
        {
          path: '/home',
          name: 'home',
          component: HomePage,
          meta: { requiresAuth: true },
        },
        {
          path: '/station',
          name: 'station',
          component: StationPage,
          meta: { requiresAuth: true },
        },
        {
          path: '/academy',
          name: 'academy',
          component: AcademyPage,
          meta: { requiresAuth: true },
        },
        {
          path: '/plaza',
          name: 'plaza',
          component: PlazaPage,
          meta: { requiresAuth: true },
        },
        {
          path: '/account',
          name: 'account',
          component: AccountPage,
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia)

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router