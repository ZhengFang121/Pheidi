import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'

import AccountPage from '@/views/AccountPage.vue'
import AcademyPage from '@/views/AcademyPage.vue'
import HomePage from '@/views/HomePage.vue'
import IntroPage from '@/views/IntroPage.vue'
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
      path: '/intro',
      name: 'intro',
      component: IntroPage,
    },

    /*
     * 登入後頁面統一放在 MainLayout 裡。
     */
    {
      path: '/',
      component: MainLayout,

      children: [
        {
          path: '',
          name: 'home',
          component: HomePage,
        },
        {
          path: 'station',
          name: 'station',
          component: StationPage,
        },
        {
          path: 'academy',
          name: 'academy',
          component: AcademyPage,
        },
        {
          path: 'plaza',
          name: 'plaza',
          component: PlazaPage,
        },
        {
          path: 'account',
          name: 'account',
          component: AccountPage,
        },
      ],
    },
  ],
})

export default router