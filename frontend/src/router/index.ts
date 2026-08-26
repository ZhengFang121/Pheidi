import { createRouter, createWebHistory } from 'vue-router'

import AdminLayout from '@/layouts/AdminLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import pinia from '@/stores'
import { useAuthStore } from '@/stores/auth'

import AccountPage from '@/views/AccountPage.vue'
import AcademyPage from '@/views/AcademyPage.vue'
import ArticleDetailPage from '@/views/ArticleDetailPage.vue'
import ForgotPasswordPage from '@/views/ForgotPasswordPage.vue'
import HomePage from '@/views/HomePage.vue'
import IntroPage from '@/views/IntroPage.vue'
import LoginPage from '@/views/LoginPage.vue'
import PlazaPage from '@/views/PlazaPage.vue'
import ResetPasswordPage from '@/views/ResetPasswordPage.vue'
import StationPage from '@/views/StationPage.vue'
import TermsPage from '@/views/TermsPage.vue'

import AdminDashboardPage from '@/views/admin/AdminDashboardPage.vue'
import ArticleCreatePage from '@/views/admin/ArticleCreatePage.vue'
import ArticleEditPage from '@/views/admin/ArticleEditPage.vue'
import ArticleManagementPage from '@/views/admin/ArticleManagementPage.vue'
import PlazaManagementPage from '@/views/admin/PlazaManagementPage.vue'
import UserManagementPage from '@/views/admin/UserManagementPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    /*
     * Intro 與登入相關頁面放在 Layout 外面，
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
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordPage,
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordPage,
    },
    {
      path: '/terms',
      name: 'terms',
      component: TermsPage,
    },

    /*
     * 登入後的一般頁面統一放在 MainLayout 裡。
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
          path: '/academy/:slug',
          name: 'article-detail',
          component: ArticleDetailPage,
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

    /*
     * 管理員後台使用獨立的 AdminLayout。
     * requiresAdmin 代表只有管理員可以進入。
     */
    {
      path: '/admin',
      component: AdminLayout,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },

      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: AdminDashboardPage,
        },
        {
          path: 'users',
          name: 'admin-users',
          component: UserManagementPage,
        },
        {
          path: 'articles',
          name: 'admin-articles',
          component: ArticleManagementPage,
        },
        {
          path: 'plaza',
          name: 'admin-plaza',
          component: PlazaManagementPage,
        },
        {
          path: 'articles/new',
          name: 'admin-article-create',
          component: ArticleCreatePage,
        },
        {
          path: 'articles/:articleId/edit',
          name: 'admin-article-edit',
          component: ArticleEditPage,
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia)

  /*
   * 未登入使用者進入需要登入的頁面時，
   * 導向登入頁面。
   */
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  /*
   * 已登入但不是管理員時，
   * 即使手動輸入 /admin，也會被送回首頁。
   */
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'home' }
  }

  /*
   * 已登入使用者不需要再次進入登入頁面。
   */
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
